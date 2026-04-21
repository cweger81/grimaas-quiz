const API_URL = "https://grimaas-quiz-api-bxa6cmacfja0fuc9.norwayeast-01.azurewebsites.net/api";

export async function login(password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  return res.json();
}

export async function createTeam(name, sessionId, participantCount) {
  const res = await fetch(`${API_URL}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sessionId, participantCount })
  });

  return res.json();
}

export async function submitScore(teamId, round, points) {
  const res = await fetch(`${API_URL}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId, round, points })
  });

  return res.json();
}

export async function getPendingScores() {
  const res = await fetch(`${API_URL}/scores?status=Pending`);
  return res.json();
}

export async function approveScore(id, password) {
  const res = await fetch(`${API_URL}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password })
  });

  return res.json();
}

export async function updateScore(id, points) {
  const res = await fetch(`${API_URL}/updateScore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, points })
  });

  return res.json();
}