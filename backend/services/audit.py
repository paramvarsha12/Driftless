import subprocess
import tempfile
import os
import shutil
import json
from typing import Dict, Any, Optional

async def clone_and_audit_repo(repo_full_name: str) -> Optional[Dict[str, Any]]:
    """Clone repository and run security audits"""
    temp_dir = None
    try:
        temp_dir = tempfile.mkdtemp(prefix="driftless_audit_")
        
        repo_url = f"https://github.com/{repo_full_name}.git"
        clone_result = subprocess.run(
            ["git", "clone", repo_url, temp_dir],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if clone_result.returncode != 0:
            print(f"Git clone failed: {clone_result.stderr}")
            return None
        
        audit_results = {}
        
        package_json_path = os.path.join(temp_dir, "package.json")
        if os.path.exists(package_json_path):
            try:
                npm_audit_result = subprocess.run(
                    "npm audit --json",
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    shell=True
                )
                if npm_audit_result.stdout:
                    audit_results["npm_audit"] = json.loads(npm_audit_result.stdout)
                else:
                    audit_results["npm_audit"] = {"error": npm_audit_result.stderr}
            except subprocess.TimeoutExpired:
                audit_results["npm_audit"] = {"error": "npm audit timed out"}
            except Exception as e:
                audit_results["npm_audit"] = {"error": str(e)}
        
        requirements_txt_path = os.path.join(temp_dir, "requirements.txt")
        if os.path.exists(requirements_txt_path):
            try:
                pip_audit_result = subprocess.run(
    "pip-audit -r requirements.txt --format json",
    cwd=temp_dir,
    capture_output=True,
    text=True,
    timeout=60,
    shell=True
)
                if pip_audit_result.stdout:
                    audit_results["pip_audit"] = json.loads(pip_audit_result.stdout)
                else:
                    audit_results["pip_audit"] = {"error": pip_audit_result.stderr}
            except subprocess.TimeoutExpired:
                audit_results["pip_audit"] = {"error": "pip audit timed out"}
            except Exception as e:
                audit_results["pip_audit"] = {"error": str(e)}
        
        if not audit_results:
            audit_results["info"] = {
                "message": "No package.json or requirements.txt found. This may be a C++, configuration, or documentation repository.",
                "repo": repo_full_name
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
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Error cleaning up temp directory: {str(e)}")