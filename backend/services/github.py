import httpx
from typing import Optional, Dict, Any

async def get_github_user(token: str) -> Optional[Dict[str, Any]]:
    """Fetch GitHub user profile using access token"""
    try:
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers=headers
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPStatusError as e:
        print(f"GitHub API error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        print(f"Error fetching GitHub user: {str(e)}")
        return None

async def get_github_repos(token: str) -> Optional[list]:
    """Fetch user's repositories using access token"""
    try:
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={"type": "owner", "sort": "updated", "per_page": 100}
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPStatusError as e:
        print(f"GitHub API error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        print(f"Error fetching GitHub repos: {str(e)}")
        return None

async def exchange_code_for_token(client_id: str, client_secret: str, code: str) -> Optional[str]:
    """Exchange OAuth code for access token"""
    try:
        data = {
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code
        }
        
        headers = {
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data=data,
                headers=headers
            )
            response.raise_for_status()
            result = response.json()
            return result.get("access_token")
    
    except httpx.HTTPStatusError as e:
        print(f"GitHub OAuth error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        print(f"Error exchanging code for token: {str(e)}")
        return None
