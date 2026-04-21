const BASE_URL = "https://grimaas-quiz-api-bxa6cmacfja0fuc9.norwayeast-01.azurewebsites.net/api";

export async function login(password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ password })
  });
  return res.json();
}

export async function createTeam(name, sessionId) {
  const res = await fetch(`${BASE_URL}/team`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ name, sessionId })
  });
  return res.json();
}

export async function submitScore(teamId, round, points) {
  return fetch(`${BASE_URL}/score`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ teamId, round, points })
  });
}

export async function getLeaderboard() {
  const res = await fetch(`${BASE_URL}/leaderboard`);
  return res.json();
}

export async function getPendingScores() {
  const res = await fetch(`${BASE_URL}/scores?status=Pending`);
  return res.json();
}

export async function approveScore(id) {
  return fetch(`${BASE_URL}/approve`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      id,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });
}

export async function updateScore(id, points) {
  return fetch(`${BASE_URL}/updateScore`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      id,
      points,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });
}