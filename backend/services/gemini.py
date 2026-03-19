from google import genai
import json
from typing import Dict, Any, Optional
import os

async def analyze_audit_results(audit_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not found")
            return None

        client = genai.Client(api_key=api_key)

        language = audit_data.get("language", "unknown")
        repo = audit_data.get("repo", "unknown")

        unscannable = language in ("cpp", "swift", "unknown", "java_no_pom", "rust_no_cargo")
        has_info_only = "info" in audit_data and "osv_audit" not in audit_data and "npm_audit" not in audit_data and "pip_audit" not in audit_data

        if unscannable or has_info_only:
            lang_display = {
                "cpp": "C++",
                "swift": "Swift",
                "java_no_pom": "Java",
                "rust_no_cargo": "Rust",
                "unknown": "Unknown"
            }.get(language, language)

            file_count = audit_data.get("file_count", 0)
            file_info = f" containing {file_count} source files" if file_count else ""

            return {
                "healthScore": 88,
                "summary": f"This {lang_display} repository{file_info} scored 88/100. The score is not higher because automated dependency vulnerability scanning could not be performed — {lang_display} projects without a standard package manager (like npm or pip) cannot be audited by tools like npm audit or pip-audit, leaving a blind spot in the security assessment. No vulnerabilities were detected in what could be assessed, and the codebase appears structurally sound. The remaining uncertainty comes from unscanned source-level risks such as insecure coding patterns, hardcoded secrets, or logic vulnerabilities that require manual code review to identify.",
                "findings": []
            }

        osv_data = audit_data.get("osv_audit", {})
        osv_vulns = osv_data.get("vulnerabilities", [])
        packages_scanned = osv_data.get("packages_scanned", 0)
        npm_data = audit_data.get("npm_audit", {})
        pip_data = audit_data.get("pip_audit", {})

        system_prompt = f"""You are a codebase security agent. You are given real vulnerability scan results for the repository '{repo}' written in {language}.

Rules:
- healthScore: 0-100 integer. Start at 100. Deduct based on real findings only:
  - critical vulnerability: -20 each
  - high: -10 each
  - medium: -5 each
  - low: -2 each
  - If no vulnerabilities found after a full scan: score should be 92-96
  - If scan found some packages but no vulns: score 90-95
  - If scan failed or partial data only: score 80-88
- When giving a score less than 100, always explain WHY in the summary. Examples:
  - "Scored 94/100 because all 23 scanned dependencies are clean, but a perfect score is withheld as dynamic runtime risks and source-level vulnerabilities cannot be ruled out without manual review."
  - "Scored 88/100 because the scan was partial — no package manager lock file was found, so transitive dependencies could not be fully verified."
  - "Scored 72/100 because 2 high severity CVEs were found in outdated dependencies."
- summary: one honest paragraph that includes the score reasoning and what was scanned
- findings: array of REAL vulnerabilities only, max 5. Each finding must have:
  - rank (integer)
  - severity (critical/high/medium/low)
  - title (specific package name and CVE if available)
  - explanation (what the vulnerability actually does)
  - fix (exact command or version to upgrade to)
  - urgency (immediate/soon/low-priority)
  - estimatedTime (e.g. "15 minutes")
- If there are NO real vulnerabilities, return findings as empty array []
- NEVER invent findings
- NEVER create findings about being unable to scan or language not supported
- NEVER penalize the score for scanning limitations unless real vulns were found
- Return only valid JSON, no markdown

JSON format:
{{"healthScore": 95, "summary": "...", "findings": []}}"""

        audit_text = json.dumps(audit_data, indent=2)
        full_prompt = f"{system_prompt}\n\nScan Results:\n{audit_text}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_prompt
        )

        if response.text:
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            try:
                result = json.loads(response_text)
                if (unscannable or has_info_only) and result.get("healthScore", 100) < 80:
                    result["healthScore"] = 88
                    result["findings"] = []
                return result
            except json.JSONDecodeError as e:
                print(f"Failed to parse Gemini response: {e}")
                print(f"Raw response: {response.text}")
                return None
        else:
            print("Gemini returned empty response")
            return None

    except Exception as e:
        print(f"Error analyzing audit results with Gemini: {str(e)}")
        return None