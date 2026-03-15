const BASE_URL = 'http://localhost:8000'

export function getToken() {
  return localStorage.getItem('driftless_token')
}

export function setToken(token) {
  localStorage.setItem('driftless_token', token)
}

export function clearToken() {
  localStorage.removeItem('driftless_token')
}

export async function fetchRepos() {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/repos/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch repos')
  return res.json()
}

export async function runAnalysis(repoFullName) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/analysis/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ repo_full_name: repoFullName, github_token: token })
  })
  if (!res.ok) throw new Error('Analysis failed')
  return res.json()
}