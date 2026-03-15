export const mockUser = { username: "paramvarsha12", avatar: "https://github.com/paramvarsha12.png", email: "paramvarsha12@gmail.com" }
export const mockRepos = [
  { id: "1", name: "tunilytics", fullName: "paramvarsha12/tunilytics", language: "JavaScript", isProduction: true, healthScore: 42, lastAnalyzed: "2 hours ago", security: "critical", currency: "warning", decay: "healthy" },
  { id: "2", name: "driftless", fullName: "paramvarsha12/driftless", language: "Python", isProduction: false, healthScore: 91, lastAnalyzed: "1 day ago", security: "healthy", currency: "healthy", decay: "healthy" },
  { id: "3", name: "knn-visualizer", fullName: "paramvarsha12/knn-visualizer", language: "JavaScript", isProduction: false, healthScore: 67, lastAnalyzed: "5 days ago", security: "warning", currency: "critical", decay: "warning" }
]
export const mockReport = {
  repoId: "1", healthScore: 42, generatedAt: "March 10, 2026 — 09:14 AM", isProduction: true,
  summary: "Your biggest risk this week is in your authentication layer. The jsonwebtoken library has a high severity CVE patched 6 weeks ago. Given this repo is in production, this should be your first fix Monday morning. Everything else can wait.",
  findings: [
    { rank: 1, severity: "critical", title: "jsonwebtoken CVE-2022-23529 — Auth bypass possible", explanation: "The version you're running allows attackers to craft malicious tokens that bypass verification. This is in your production auth flow.", fix: "npm install jsonwebtoken@9.0.2", urgency: "This Week", estimatedTime: "10 minutes" },
    { rank: 2, severity: "high", title: "axios@0.21.1 — SSRF vulnerability in redirects", explanation: "Affected versions allow server-side request forgery via redirect handling. You use axios for Spotify API calls.", fix: "npm install axios@1.6.0", urgency: "This Week", estimatedTime: "5 minutes" },
    { rank: 3, severity: "medium", title: "Node.js 16 reached end-of-life", explanation: "No more security patches. Low urgency since this isn't causing active CVEs yet, but schedule an upgrade.", fix: "Update .nvmrc to node 20 LTS and test", urgency: "This Month", estimatedTime: "2 hours" }
  ]
}
export const mockHealthHistory = [
  { week: "Feb 17", score: 71 }, { week: "Feb 24", score: 65 }, { week: "Mar 3", score: 58 }, { week: "Mar 10", score: 42 }
]
