import { useEffect, useState } from "react";
import {
  getPendingScores,
  approveScore,
  updateScore,
  createSession,
  getActiveSession,
  closeSession
} from "../api";

export default function AdminPage() {
  const [scores, setScores] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newSessionPassword, setNewSessionPassword] = useState("");

  const [editId, setEditId] = useState(null);
  const [newPoints, setNewPoints] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const [isAdmin, setIsAdmin] = useState(
    !!localStorage.getItem("adminPassword")
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // 🔐 LOGIN
  function handleLogin() {
    if (password === "FJOSETADMIN123") {
      localStorage.setItem("adminPassword", password);
      setIsAdmin(true);
      setError("");
    } else {
      setError("Feil passord");
    }
  }

  function logout() {
    localStorage.removeItem("adminPassword");
    setIsAdmin(false);
  }

  function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  // 🧠 grouping + deltakerinfo
  function groupByTeam(scores) {
    const teams = {};

    scores.forEach(s => {
      const teamName = s.teamName;
      const points = s.points ?? s.Points;
      const participantCount = s.participantCount ?? s.ParticipantCount ?? 1;

      if (!teams[teamName]) {
        teams[teamName] = {
          teamName,
          participantCount,
          total: 0,
          rounds: []
        };
      }

      teams[teamName].total += points;
      teams[teamName].rounds.push({
        ...s,
        points
      });
    });

    return Object.values(teams).sort((a, b) => b.total - a.total);
  }

  async function load() {
    const data = await getPendingScores();
    const session = await getActiveSession();

    setScores(data);
    setActiveSession(session);
  }

  useEffect(() => {
    if (isAdmin) {
      load();
      const i = setInterval(load, 5000);
      return () => clearInterval(i);
    }
  }, [isAdmin]);

  async function handleUpdate(id) {
    setLoadingId(id);

    const res = await updateScore(id, Number(newPoints));

    if (res.status === 401) {
      alert("Session utløpt – logg inn på nytt");
      localStorage.removeItem("adminPassword");
      setIsAdmin(false);
      return;
    }

    setEditId(null);
    setNewPoints("");
    await load();
    setLoadingId(null);
  }

  async function handleApprove(id) {
    setLoadingId(id);

    const res = await approveScore(id);

    if (res.status === 401) {
      alert("Session utløpt – logg inn på nytt");
      localStorage.removeItem("adminPassword");
      setIsAdmin(false);
      return;
    }

    await load();
    setLoadingId(null);
  }

  async function handleCreateSession() {
    if (!newSessionPassword) {
      alert("Skriv passord");
      return;
    }

    await createSession(newSessionPassword);
    setNewSessionPassword("");
    await load();
  }

  async function handleCloseSession() {
    await closeSession();
    await load();
  }

  // 🔐 LOGIN VIEW
  if (!isAdmin) {
    return (
      <div className="container">
        <h1>Admin login</h1>

        <input
          placeholder="Passord"
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>Logg inn</button>

        {error && <p>{error}</p>}
      </div>
    );
  }

  // 🧑‍💼 ADMIN VIEW
  return (
    <div className="container">
      <h1>🧑‍💼 Admin</h1>

      <button onClick={logout}>Logg ut</button>

      {/* 🟢 AKTIV QUIZ */}
      <h2>Aktiv quiz</h2>

      {activeSession ? (
        <>
          <p>Dato: {formatDate(activeSession.CreatedAt)}</p>
          <p>Passord: {activeSession.Password}</p>

          <button onClick={handleCloseSession}>
            🔴 Lukk quiz
          </button>
        </>
      ) : (
        <p>Ingen aktiv quiz</p>
      )}

      {/* 🟢 NY QUIZ */}
      <h2>Start ny quiz</h2>

      <input
        placeholder="Nytt passord"
        value={newSessionPassword}
        onChange={e => setNewSessionPassword(e.target.value)}
      />

      <button onClick={handleCreateSession}>
        🚀 Start ny quiz
      </button>

      <hr />

      {/* 🟢 SCORES */}
      {scores.length === 0 && <p>Ingen pending scores</p>}

      {groupByTeam(scores).map(team => (
        <div
          key={team.teamName}
          style={{
            background: "#1a1d24",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "8px",
            width: "100%"
          }}
        >
          <h2>{team.teamName}</h2>

          <p>{team.participantCount} deltakere</p>
          <h3>Totalt: {team.total} poeng</h3>
          <p>
            Snitt:{" "}
            {(team.total / team.participantCount).toFixed(1)}
          </p>

          {team.rounds.map(s => (
            <div key={s.id || s.Id} style={{ marginTop: "10px" }}>
              <p>Runde {s.round || s.Round}</p>

              {editId === (s.id || s.Id) ? (
                <>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                  />

                  <button
                    onClick={() => handleUpdate(s.id || s.Id)}
                    disabled={loadingId === (s.id || s.Id)}
                  >
                    {loadingId === (s.id || s.Id) ? "..." : "Lagre"}
                  </button>
                </>
              ) : (
                <>
                  <p>
                    <strong>{s.points} poeng</strong>
                  </p>

                  <button
                    onClick={() => {
                      setEditId(s.id || s.Id);
                      setNewPoints(s.points);
                    }}
                  >
                    ✏️ Endre
                  </button>
                </>
              )}

              <button
                onClick={() => handleApprove(s.id || s.Id)}
                disabled={loadingId === (s.id || s.Id)}
              >
                {loadingId === (s.id || s.Id)
                  ? "..."
                  : "✔️ Godkjenn"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}