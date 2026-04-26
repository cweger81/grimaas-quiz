const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://grimaas-quiz-api-bxa6cmacfja0fuc9.norwayeast-01.azurewebsites.net/api"
).replace(/\/$/, "");

async function readJson(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  return null;
}

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.value)) {
    return data.value;
  }

  return [];
}

export async function login(password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, admin: true })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function createTeam(name, sessionId, participantCount) {
  const res = await fetch(`${API_URL}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, sessionId, participantCount })
  });

  return res.json();
}

export async function getTeams(sessionId) {
  const res = await fetch(`${API_URL}/team?sessionId=${sessionId}`, {
    cache: "no-store"
  });

  return normalizeList(await res.json());
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
  const res = await fetch(`${API_URL}/scores?status=Pending`, {
    cache: "no-store"
  });
  return normalizeList(await res.json());
}

export async function getUpcomingDates() {
  const res = await fetch(`${API_URL}/upcomingdates`, {
    cache: "no-store"
  });

  return normalizeList(await res.json());
}

export async function addUpcomingDate(quizDate) {
  const res = await fetch(`${API_URL}/addupcomingdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quizDate,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function deleteUpcomingDate(id) {
  const res = await fetch(`${API_URL}/deleteupcomingdate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function approveScore(id) {
  const res = await fetch(`${API_URL}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function updateScore(id, points) {
  const res = await fetch(`${API_URL}/updateScore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      points,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function getLeaderboard() {
  const res = await fetch(`${API_URL}/leaderboard`, {
    cache: "no-store"
  });
  return normalizeList(await res.json());
}

export async function getActiveSession() {
  const res = await fetch(`${API_URL}/getActiveSession`, {
    cache: "no-store"
  });
  return res.json();
}

export async function closeSession() {
  const res = await fetch(`${API_URL}/closeSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}

export async function createSession(password) {
  const res = await fetch(`${API_URL}/createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password,
      adminPassword: localStorage.getItem("adminPassword")
    })
  });

  return {
    ok: res.ok,
    status: res.status,
    data: await readJson(res)
  };
}
