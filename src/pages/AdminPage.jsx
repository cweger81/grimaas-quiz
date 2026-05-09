import { useCallback, useEffect, useState } from "react";
import {
  adminLogin,
  closeSession,
  createSession,
  getAdminLeaderboard,
  setRoundVisibility,
  updateScore,
  updateTeamTotal
} from "../api";

function formatDate(date) {
  if (!date) {
    return "";
  }

  return new Date(date).toLocaleDateString("no-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

function parsePoints(value) {
  const normalized = String(value).replace(",", ".").trim();
  const points = Number(normalized);

  if (!normalized || !Number.isFinite(points) || points < 0) {
    return null;
  }

  return points;
}

export default function AdminPage() {
  const [activeSession, setActiveSession] = useState(null);
  const [visibleRounds, setVisibleRounds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newSessionPassword, setNewSessionPassword] = useState("");
  const [editKey, setEditKey] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [totalEditTeamId, setTotalEditTeamId] = useState(null);
  const [newTotal, setNewTotal] = useState("");
  const [loadingKey, setLoadingKey] = useState("");
  const [isAdmin, setIsAdmin] = useState(
    () => !!localStorage.getItem("adminPassword")
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await getAdminLeaderboard();

    if (result.status === 401) {
      logout();
      return;
    }

    const payload = result.data || {};
    setActiveSession(payload.activeSession || null);
    setVisibleRounds(payload.visibleRounds || []);
    setTeams(payload.teams || []);
  }, []);

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
    setActiveSession(null);
    setVisibleRounds([]);
    setTeams([]);
    setEditKey("");
    setNewPoints("");
    setTotalEditTeamId(null);
    setNewTotal("");
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
  }, [isAdmin, load]);

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

  async function handleShowRound(round) {
    if (!activeSession?.Id) {
      return;
    }

    setLoadingKey(`show:${round}`);

    try {
      const result = await setRoundVisibility(activeSession.Id, round, true);

      if (result.status === 401) {
        alert("Admin-innloggingen utlop. Logg inn pa nytt.");
        logout();
        return;
      }

      await load();
    } finally {
      setLoadingKey("");
    }
  }

  async function handleUpdateRound(teamId, round) {
    const parsedPoints = parsePoints(newPoints);

    if (parsedPoints === null) {
      alert("Skriv inn gyldige poeng, for eksempel 13,5.");
      return;
    }

    setLoadingKey(`round:${teamId}:${round}`);

    try {
      const result = await updateScore({ teamId, round }, parsedPoints);

      if (result.status === 401) {
        alert("Admin-innloggingen utlop. Logg inn pa nytt.");
        logout();
        return;
      }

      setEditKey("");
      setNewPoints("");
      await load();
    } finally {
      setLoadingKey("");
    }
  }

  async function handleUpdateTotal(teamId) {
    const parsedTotal = parsePoints(newTotal);

    if (parsedTotal === null) {
      alert("Skriv inn gyldig totalscore.");
      return;
    }

    setLoadingKey(`total:${teamId}`);

    try {
      const result = await updateTeamTotal(teamId, parsedTotal);

      if (result.status === 401) {
        alert("Admin-innloggingen utlop. Logg inn pa nytt.");
        logout();
        return;
      }

      setTotalEditTeamId(null);
      setNewTotal("");
      await load();
    } finally {
      setLoadingKey("");
    }
  }

  function isRoundVisible(round) {
    return visibleRounds.some(item => item.round === round && item.isVisible);
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
            onChange={event => setPassword(event.target.value)}
          />

          <button onClick={handleLogin}>Logg inn</button>

          {error ? <p>{error}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <img className="brand-logo brand-logo-admin" src="/grimaas-logo.png" alt="Grimaas logo" />
      <h1>Admin</h1>

      <div className="admin-toolbar">
        <button onClick={logout}>Logg ut</button>
        <a className="quiz-link-button admin-nav-link" href="/adminleaderboard">
          Admin leaderboard
        </a>
      </div>

      <section className="admin-section">
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
      </section>

      {!activeSession ? (
        <section className="admin-section">
          <h2>Start ny quiz</h2>

          <input
            placeholder="Nytt passord"
            value={newSessionPassword}
            onChange={event => setNewSessionPassword(event.target.value)}
          />

          <button onClick={handleCreateSession}>Start ny quiz</button>
        </section>
      ) : null}

      {activeSession ? (
        <section className="admin-section">
          <h2>Vis poeng hver runde</h2>
          <div className="admin-round-actions">
            {[1, 2, 3].map(round => {
              const visible = isRoundVisible(round);
              const buttonKey = `show:${round}`;

              return (
                <button
                  key={round}
                  className={visible ? "admin-visible-button" : ""}
                  disabled={visible || loadingKey === buttonKey}
                  onClick={() => handleShowRound(round)}
                >
                  {visible
                    ? `Runde ${round} vises`
                    : loadingKey === buttonKey
                    ? "..."
                    : `Vis poeng runde ${round}`}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="admin-section">
        <h2>Lag og poeng</h2>

        {teams.length === 0 ? (
          <p>Ingen lag registrert ennå</p>
        ) : (
          <div className="admin-team-stack">
            {teams.map(team => (
              <article key={team.id} className="admin-team-panel">
                <div className="admin-team-panel-header">
                  <div>
                    <h3>{team.name}</h3>
                    <p>{team.participantCount} deltakere</p>
                    <p>
                      Utslagssvar:{" "}
                      {team.tieBreakerAnswer ? team.tieBreakerAnswer : "Ikke sendt inn"}
                    </p>
                  </div>

                  <div className="admin-total-box">
                    <strong>Total: {team.total}</strong>
                    {team.totalAdjustment ? (
                      <span>Justeringspoeng: {team.totalAdjustment}</span>
                    ) : null}
                  </div>
                </div>

                <div className="admin-score-grid">
                  {[1, 2, 3].map(round => {
                    const roundData = team.rounds[round];
                    const key = `${team.id}:${round}`;
                    const isEditing = editKey === key;
                    const actionKey = `round:${team.id}:${round}`;

                    return (
                      <div key={round} className="admin-score-card">
                        <p className="admin-round-pill">Runde {round}</p>
                        <p className="admin-score-value">{roundData.points}</p>

                        {isEditing ? (
                          <>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              min="0"
                              value={newPoints}
                              onChange={event => setNewPoints(event.target.value)}
                            />
                            <button
                              disabled={loadingKey === actionKey}
                              onClick={() => handleUpdateRound(team.id, round)}
                            >
                              {loadingKey === actionKey ? "..." : "Lagre"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditKey(key);
                              setNewPoints(String(roundData.points));
                            }}
                          >
                            Endre poeng
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="admin-total-editor">
                  {totalEditTeamId === team.id ? (
                    <>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        value={newTotal}
                        onChange={event => setNewTotal(event.target.value)}
                      />
                      <button
                        disabled={loadingKey === `total:${team.id}`}
                        onClick={() => handleUpdateTotal(team.id)}
                      >
                        {loadingKey === `total:${team.id}` ? "..." : "Lagre totalscore"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setTotalEditTeamId(team.id);
                        setNewTotal(String(team.total));
                      }}
                    >
                      Endre totalscore
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
