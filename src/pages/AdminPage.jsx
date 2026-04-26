import { useEffect, useState } from "react";
import {
  addUpcomingDate,
  adminLogin,
  approveScore,
  closeSession,
  createSession,
  deleteUpcomingDate,
  getActiveSession,
  getPendingScores,
  getTeams,
  getUpcomingDates,
  updateScore
} from "../api";

export default function AdminPage() {
  const [scores, setScores] = useState([]);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [newSessionPassword, setNewSessionPassword] = useState("");
  const [editId, setEditId] = useState(null);
  const [newPoints, setNewPoints] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(
    () => !!localStorage.getItem("adminPassword")
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [newUpcomingDate, setNewUpcomingDate] = useState("");

  function parsePoints(value) {
    const normalized = String(value).replace(",", ".").trim();
    const points = Number(normalized);

    if (!normalized || !Number.isFinite(points) || points < 0) {
      return null;
    }

    return points;
  }

  function formatDate(date) {
    if (!date) return "";

    const value = new Date(date);
    return value.toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  function formatUpcomingDate(date) {
    return new Date(date).toLocaleDateString("no-NO", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  async function load() {
    const [session, pendingScores] = await Promise.all([
      getActiveSession(),
      getPendingScores()
    ]);

    const upcoming = await getUpcomingDates();
    const teams = session?.Id ? await getTeams(session.Id) : [];

    setScores(pendingScores);
    setActiveSession(session);
    setRegisteredTeams(teams);
    setUpcomingDates(upcoming);
  }

  async function handleLogin() {
    const result = await adminLogin(password);

    if (!result.ok) {
      setError("Feil passord");
      return;
    }

    localStorage.setItem("adminPassword", password);
    setIsAdmin(true);
    setPassword("");
    setError("");
  }

  function logout() {
    localStorage.removeItem("adminPassword");
    setIsAdmin(false);
    setScores([]);
    setRegisteredTeams([]);
    setActiveSession(null);
    setEditId(null);
    setNewPoints("");
    setUpcomingDates([]);
    setNewUpcomingDate("");
  }

  function groupByTeam(items) {
    const teams = {};

    items.forEach(item => {
      const teamName = item.teamName;
      const points = item.points ?? item.Points;
      const participantCount =
        item.participantCount ?? item.ParticipantCount ?? 1;

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
        ...item,
        points
      });
    });

    return Object.values(teams).sort((a, b) => b.total - a.total);
  }

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const initialLoadId = setTimeout(() => {
      void load();
    }, 0);

    const intervalId = setInterval(() => {
      void load();
    }, 5000);

    return () => {
      clearTimeout(initialLoadId);
      clearInterval(intervalId);
    };
  }, [isAdmin]);

  async function handleUpdate(id) {
    setLoadingId(id);

    try {
      const parsedPoints = parsePoints(newPoints);

      if (parsedPoints === null) {
        alert("Skriv inn gyldige poeng, for eksempel 13,5.");
        return;
      }

      const result = await updateScore(id, parsedPoints);

      if (result.status === 401) {
        alert("Admin-innloggingen utlop. Logg inn pa nytt.");
        logout();
        return;
      }

      setEditId(null);
      setNewPoints("");
      await load();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleApprove(id) {
    setLoadingId(id);

    try {
      const result = await approveScore(id);

      if (result.status === 401) {
        alert("Admin-innloggingen utlop. Logg inn pa nytt.");
        logout();
        return;
      }

      await load();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleCreateSession() {
    if (!newSessionPassword.trim()) {
      alert("Skriv passord");
      return;
    }

    const result = await createSession(newSessionPassword.trim());

    if (result.status === 401) {
      alert("Admin-innloggingen utlop. Logg inn pa nytt.");
      logout();
      return;
    }

    setNewSessionPassword("");
    await load();
  }

  async function handleCloseSession() {
    const result = await closeSession();

    if (result?.status === 401) {
      alert("Admin-innloggingen utlop. Logg inn pa nytt.");
      logout();
      return;
    }

    setActiveSession(null);
    await load();
  }

  async function handleAddUpcomingDate() {
    if (!newUpcomingDate) {
      alert("Velg dato");
      return;
    }

    const result = await addUpcomingDate(newUpcomingDate);

    if (result.status === 401) {
      alert("Admin-innloggingen utlop. Logg inn pa nytt.");
      logout();
      return;
    }

    if (!result.ok) {
      alert("Kunne ikke lagre dato");
      return;
    }

    setNewUpcomingDate("");
    await load();
  }

  async function handleDeleteUpcomingDate(id) {
    const result = await deleteUpcomingDate(id);

    if (result.status === 401) {
      alert("Admin-innloggingen utlop. Logg inn pa nytt.");
      logout();
      return;
    }

    await load();
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="admin-login-card">
          <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
          <h1>Admin login</h1>

          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Logg inn</button>

          {error && <p>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <img className="brand-logo brand-logo-admin" src="/grimaas-logo.png" alt="Grimaas logo" />
      <h1>Admin</h1>

      <button onClick={logout}>Logg ut</button>

      <h2>Aktiv quiz</h2>

      {activeSession ? (
        <>
          <p>Dato: {formatDate(activeSession.QuizDate)}</p>
          <p>Passord: {activeSession.Password}</p>
          <button onClick={handleCloseSession}>Lukk quiz</button>
        </>
      ) : (
        <p>Ingen aktiv quiz</p>
      )}

      <h2>Start ny quiz</h2>

      <input
        placeholder="Nytt passord"
        value={newSessionPassword}
        onChange={e => setNewSessionPassword(e.target.value)}
      />

      <button onClick={handleCreateSession}>Start ny quiz</button>

      <hr />

      <h2>Kommende quizdatoer</h2>

      <div className="admin-upcoming-form">
        <input
          type="date"
          value={newUpcomingDate}
          onChange={e => setNewUpcomingDate(e.target.value)}
        />
        <button onClick={handleAddUpcomingDate}>Legg til dato</button>
      </div>

      {upcomingDates.length === 0 ? (
        <p>Ingen kommende datoer lagret</p>
      ) : (
        <div className="admin-upcoming-list">
          {upcomingDates.map(item => (
            <div key={item.Id || item.id} className="admin-upcoming-card">
              <span>{formatUpcomingDate(item.QuizDate || item.quizDate)}</span>
              <button onClick={() => handleDeleteUpcomingDate(item.Id || item.id)}>
                Slett
              </button>
            </div>
          ))}
        </div>
      )}

      <hr />

      <h2>Registrerte lag</h2>

      {registeredTeams.length === 0 ? (
        <p>Ingen lag registrert ennå</p>
      ) : (
        <div className="admin-team-list">
          {registeredTeams.map(team => (
            <div key={team.Id || team.id} className="admin-team-card">
              <strong>{team.Name || team.name}</strong>
              <span>{team.ParticipantCount || team.participantCount} deltakere</span>
            </div>
          ))}
        </div>
      )}

      <hr />

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
          <p>Snitt: {(team.total / team.participantCount).toFixed(1)}</p>

          {team.rounds.map(score => (
            <div key={score.id || score.Id} style={{ marginTop: "10px" }}>
              <p className="admin-round-pill">Runde {score.round || score.Round}</p>

              {editId === (score.id || score.Id) ? (
                <>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                  />

                  <button
                    onClick={() => handleUpdate(score.id || score.Id)}
                    disabled={loadingId === (score.id || score.Id)}
                  >
                    {loadingId === (score.id || score.Id) ? "..." : "Lagre"}
                  </button>
                </>
              ) : (
                <>
                  <p>
                    <strong>{score.points} poeng</strong>
                  </p>

                  <button
                    onClick={() => {
                      setEditId(score.id || score.Id);
                      setNewPoints(String(score.points));
                    }}
                  >
                    Endre
                  </button>
                </>
              )}

              <button
                onClick={() => handleApprove(score.id || score.Id)}
                disabled={loadingId === (score.id || score.Id)}
              >
                {loadingId === (score.id || score.Id) ? "..." : "Godkjenn"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
