import subprocess
import tempfile
import os
import shutil
import json
import httpx
import re
from typing import Dict, Any, Optional

OSV_API = "https://api.osv.dev/v1/querybatch"

def parse_go_mod(content: str):
    packages = []
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("require") or line.startswith("//") or line in (")", "("):
            continue
        parts = line.split()
        if len(parts) >= 2:
            name = parts[0]
            version = parts[1].lstrip("v")
            if name and version and not version.startswith("("):
                packages.append({"name": name, "version": version, "ecosystem": "Go"})
    return packages

def parse_cargo_toml(content: str):
    packages = []
    in_deps = False
    for line in content.splitlines():
        line = line.strip()
        if line in ("[dependencies]", "[dev-dependencies]", "[build-dependencies]"):
            in_deps = True
            continue
        if line.startswith("[") and line.endswith("]"):
            in_deps = False
            continue
        if in_deps and "=" in line:
            parts = line.split("=", 1)
            name = parts[0].strip()
            version = parts[1].strip().strip('"').strip("'").lstrip("^~>=<").split(",")[0].strip()
            if name and version and not version.startswith("{"):
                packages.append({"name": name, "version": version, "ecosystem": "crates.io"})
    return packages

def parse_pom_xml(content: str):
    packages = []
    deps = re.findall(
        r'<dependency>.*?<groupId>(.*?)</groupId>.*?<artifactId>(.*?)</artifactId>.*?<version>(.*?)</version>.*?</dependency>',
        content, re.DOTALL
    )
    for group, artifact, version in deps:
        name = f"{group.strip()}:{artifact.strip()}"
        version = version.strip()
        if "${" not in version:
            packages.append({"name": name, "version": version, "ecosystem": "Maven"})
    return packages

def parse_gemfile_lock(content: str):
    packages = []
    in_gems = False
    for line in content.splitlines():
        if line.strip() == "GEM":
            in_gems = True
            continue
        if line.strip() in ("PLATFORMS", "DEPENDENCIES"):
            in_gems = False
            continue
        if in_gems and line.startswith("    ") and not line.startswith("      "):
            parts = line.strip().split(" ")
            if len(parts) >= 2:
                name = parts[0]
                version = parts[1].strip("()")
                packages.append({"name": name, "version": version, "ecosystem": "RubyGems"})
    return packages

def parse_composer_json(content: str):
    packages = []
    try:
        data = json.loads(content)
        for section in ["require", "require-dev"]:
            for name, version in data.get(section, {}).items():
                if name == "php" or name.startswith("ext-"):
                    continue
                clean_version = version.lstrip("^~>=<").split("|")[0].split(" ")[0].strip()
                if clean_version:
                    packages.append({"name": name, "version": clean_version, "ecosystem": "Packagist"})
    except Exception:
        pass
    return packages

def parse_pubspec_yaml(content: str):
    packages = []
    in_deps = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped in ("dependencies:", "dev_dependencies:"):
            in_deps = True
            continue
        if stripped.endswith(":") and not line.startswith(" ") and stripped not in ("dependencies:", "dev_dependencies:"):
            in_deps = False
            continue
        if in_deps and ":" in stripped and not stripped.startswith("#"):
            parts = stripped.split(":", 1)
            name = parts[0].strip()
            version = parts[1].strip().lstrip("^~>=< ").split(" ")[0]
            if name and version and not version.startswith("{") and name not in ("sdk", "flutter"):
                packages.append({"name": name, "version": version, "ecosystem": "Pub"})
    return packages

def parse_requirements_txt(content: str):
    packages = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        match = re.match(r'^([A-Za-z0-9_\-\.]+)\s*[=><!\^~]+\s*([0-9][^\s,;]*)', line)
        if match:
            packages.append({"name": match.group(1), "version": match.group(2), "ecosystem": "PyPI"})
        else:
            name_match = re.match(r'^([A-Za-z0-9_\-\.]+)', line)
            if name_match:
                packages.append({"name": name_match.group(1), "version": "0.0.0", "ecosystem": "PyPI"})
    return packages

def detect_language(work_dir: str) -> str:
    files = os.listdir(work_dir)
    if "package.json" in files:
        return "javascript"
    if "requirements.txt" in files or "pyproject.toml" in files:
        return "python"
    if "go.mod" in files:
        return "go"
    if "Cargo.toml" in files:
        return "rust"
    if "pom.xml" in files:
        return "java"
    if "Gemfile.lock" in files:
        return "ruby"
    if "composer.json" in files:
        return "php"
    if "pubspec.yaml" in files:
        return "dart"
    if "Package.swift" in files:
        return "swift"
    all_files = []
    for root, dirs, fs in os.walk(work_dir):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__']]
        all_files.extend(fs)
    exts = [os.path.splitext(f)[1].lower() for f in all_files]
    ext_counts = {}
    for e in exts:
        ext_counts[e] = ext_counts.get(e, 0) + 1
    if ext_counts.get(".cpp", 0) + ext_counts.get(".c", 0) + ext_counts.get(".h", 0) + ext_counts.get(".cc", 0) + ext_counts.get(".cxx", 0) > 0:
        return "cpp"
    if ext_counts.get(".java", 0) > 3:
        return "java_no_pom"
    if ext_counts.get(".rs", 0) > 3:
        return "rust_no_cargo"
    return "unknown"

def resolve_work_dir(temp_dir: str) -> str:
    files = os.listdir(temp_dir)
    non_git = [f for f in files if f != '.git']
    if len(non_git) == 1:
        potential_subdir = os.path.join(temp_dir, non_git[0])
        if os.path.isdir(potential_subdir):
            return potential_subdir
    return temp_dir

async def query_osv(packages: list, ecosystem: str) -> dict:
    if not packages:
        return {"vulnerabilities": []}
    queries = []
    for pkg in packages:
        queries.append({
            "version": pkg["version"],
            "package": {
                "name": pkg["name"],
                "ecosystem": pkg.get("ecosystem", ecosystem)
            }
        })
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(OSV_API, json={"queries": queries})
            if resp.status_code == 200:
                data = resp.json()
                vulns = []
                results = data.get("results", [])
                for i, result in enumerate(results):
                    pkg_vulns = result.get("vulns", [])
                    for v in pkg_vulns:
                        vulns.append({
                            "id": v.get("id"),
                            "summary": v.get("summary", ""),
                            "severity": v.get("database_specific", {}).get("severity", "UNKNOWN"),
                            "package": packages[i]["name"],
                            "version": packages[i]["version"],
                            "references": [r.get("url") for r in v.get("references", [])[:2]]
                        })
                return {"vulnerabilities": vulns, "packages_scanned": len(packages)}
    except Exception as e:
        return {"error": str(e), "vulnerabilities": []}
    return {"vulnerabilities": []}

async def clone_and_audit_repo(repo_full_name: str) -> Optional[Dict[str, Any]]:
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp(prefix="driftless_audit_")

        repo_url = f"https://github.com/{repo_full_name}.git"
        clone_result = subprocess.run(
            ["git", "clone", "--depth=1", repo_url, temp_dir],
            capture_output=True,
            text=True,
            timeout=120
        )

        if clone_result.returncode != 0:
            print(f"Git clone failed: {clone_result.stderr}")
            return None

        work_dir = resolve_work_dir(temp_dir)
        language = detect_language(work_dir)
        print(f"Detected language for {repo_full_name}: {language} in {work_dir}")

        audit_results = {"language": language, "repo": repo_full_name}

        # ── JavaScript / Node.js ──
        if language == "javascript":
            package_json_path = os.path.join(work_dir, "package.json")
            if os.path.exists(package_json_path):
                try:
                    npm_result = subprocess.run(
                        "npm audit --json",
                        cwd=work_dir,
                        capture_output=True,
                        text=True,
                        timeout=120,
                        shell=True
                    )
                    if npm_result.stdout:
                        try:
                            audit_results["npm_audit"] = json.loads(npm_result.stdout)
                        except Exception:
                            audit_results["npm_audit"] = {"error": "Failed to parse npm audit output"}
                    else:
                        audit_results["npm_audit"] = {"error": npm_result.stderr}
                except Exception as e:
                    audit_results["npm_audit"] = {"error": str(e)}

        # ── Python ──
        elif language == "python":
            req_path = os.path.join(work_dir, "requirements.txt")
            if os.path.exists(req_path):
                try:
                    pip_result = subprocess.run(
                        "pip-audit -r requirements.txt --format json --skip-editable",
                        cwd=work_dir,
                        capture_output=True,
                        text=True,
                        timeout=120,
                        shell=True
                    )
                    if pip_result.stdout:
                        try:
                            audit_results["pip_audit"] = json.loads(pip_result.stdout)
                        except Exception:
                            audit_results["pip_audit"] = {"error": "Failed to parse pip-audit output"}
                    else:
                        audit_results["pip_audit"] = {"error": pip_result.stderr}
                except Exception as e:
                    audit_results["pip_audit"] = {"error": str(e)}

                # OSV fallback — works even without version numbers
                try:
                    req_content = open(req_path).read()
                    packages = parse_requirements_txt(req_content)
                    # resolve real versions using pip index
                    for pkg in packages:
                        if pkg["version"] == "0.0.0":
                            try:
                                result = subprocess.run(
                                    f"pip index versions {pkg['name']}",
                                    capture_output=True, text=True, shell=True, timeout=10
                                )
                                match = re.search(r'LATEST:\s*([0-9][^\s]+)', result.stdout)
                                if match:
                                    pkg["version"] = match.group(1)
                            except Exception:
                                pass
                    if packages:
                        osv_result = await query_osv(packages, "PyPI")
                        audit_results["osv_audit"] = osv_result
                        print(f"OSV found {len(osv_result.get('vulnerabilities', []))} vulns for Python repo")
                except Exception as e:
                    print(f"OSV fallback error: {e}")
            else:
                audit_results["info"] = {
                    "message": "No requirements.txt found.",
                    "repo": repo_full_name,
                    "language": "Python"
                }

        # ── Go ──
        elif language == "go":
            go_mod_path = os.path.join(work_dir, "go.mod")
            content = open(go_mod_path).read()
            packages = parse_go_mod(content)
            audit_results["osv_audit"] = await query_osv(packages, "Go")
            audit_results["packages_found"] = len(packages)

        # ── Rust ──
        elif language == "rust":
            cargo_path = os.path.join(work_dir, "Cargo.toml")
            content = open(cargo_path).read()
            packages = parse_cargo_toml(content)
            audit_results["osv_audit"] = await query_osv(packages, "crates.io")
            audit_results["packages_found"] = len(packages)

        # ── Java (Maven) ──
        elif language == "java":
            pom_path = os.path.join(work_dir, "pom.xml")
            content = open(pom_path).read()
            packages = parse_pom_xml(content)
            audit_results["osv_audit"] = await query_osv(packages, "Maven")
            audit_results["packages_found"] = len(packages)

        # ── Ruby ──
        elif language == "ruby":
            gemfile_path = os.path.join(work_dir, "Gemfile.lock")
            content = open(gemfile_path).read()
            packages = parse_gemfile_lock(content)
            audit_results["osv_audit"] = await query_osv(packages, "RubyGems")
            audit_results["packages_found"] = len(packages)

        # ── PHP ──
        elif language == "php":
            composer_path = os.path.join(work_dir, "composer.json")
            content = open(composer_path).read()
            packages = parse_composer_json(content)
            audit_results["osv_audit"] = await query_osv(packages, "Packagist")
            audit_results["packages_found"] = len(packages)

        # ── Dart / Flutter ──
        elif language == "dart":
            pubspec_path = os.path.join(work_dir, "pubspec.yaml")
            content = open(pubspec_path).read()
            packages = parse_pubspec_yaml(content)
            audit_results["osv_audit"] = await query_osv(packages, "Pub")
            audit_results["packages_found"] = len(packages)

        # ── C++ ──
        elif language == "cpp":
            audit_results["info"] = {
                "message": "C++ repository detected. No package manager found.",
                "repo": repo_full_name,
                "language": "C++"
            }
            cpp_files = []
            for root, dirs, files in os.walk(work_dir):
                dirs[:] = [d for d in dirs if d != '.git']
                cpp_files.extend([f for f in files if f.endswith(('.cpp', '.c', '.h', '.hpp', '.cc', '.cxx'))])
            audit_results["file_count"] = len(cpp_files)

        # ── Java without pom.xml ──
        elif language == "java_no_pom":
            audit_results["info"] = {
                "message": "Java repository detected but no pom.xml found.",
                "repo": repo_full_name,
                "language": "Java"
            }

        # ── Rust without Cargo.toml ──
        elif language == "rust_no_cargo":
            audit_results["info"] = {
                "message": "Rust repository detected but no Cargo.toml found.",
                "repo": repo_full_name,
                "language": "Rust"
            }

        # ── Unknown ──
        else:
            audit_results["info"] = {
                "message": "Repository language could not be determined.",
                "repo": repo_full_name,
                "language": "unknown"
            }

        return audit_results

    except subprocess.TimeoutExpired:
        print("Repository cloning timed out")
        return None
    except Exception as e:
        print(f"Error during repository audit: {str(e)}")
        return None
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception as e:
                print(f"Error cleaning up temp directory: {str(e)}")