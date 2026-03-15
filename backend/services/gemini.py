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

        system_prompt = """You are a codebase health agent. Given raw npm audit and pip-audit output, return a JSON object with keys: healthScore (0-100 integer), summary (one paragraph string), findings (array of max 5 objects each with: rank, severity, title, explanation, fix, urgency, estimatedTime). Return only valid JSON, no markdown."""

        audit_text = json.dumps(audit_data, indent=2)
        full_prompt = f"{system_prompt}\n\nAudit Data:\n{audit_text}"

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
                return json.loads(response_text)
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