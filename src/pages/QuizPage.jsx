import { useState, useEffect } from "react";
import { login, createTeam, submitScore } from "../api";

export default function QuizPage() {
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [team, setTeam] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [message, setMessage] = useState("");

  // 🔒 lagre hvilke runder som er sendt
  const [submittedRounds, setSubmittedRounds] = useState(() => {
    const saved = localStorage.getItem("submittedRounds");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("submittedRounds", JSON.stringify(submittedRounds));
  }, [submittedRounds]);

  async function handleLogin() {
    const res = await login(password);

    if (!res || !res.sessionId) {
      setMessage("Feil passord");
      return;
    }

    setSession(res);
    setMessage("");
  }

  async function handleCreateTeam() {
    const res = await createTeam(teamName, session.sessionId);

    const teamId = res.id || res.Id;

    if (!teamId) {
      setMessage("Feil ved oppretting av lag");
      return;
    }

    localStorage.setItem("teamId", teamId);
    localStorage.removeItem("submittedRounds"); // reset ved nytt lag

    setSubmittedRounds({});
    setTeam(res);
    setMessage("");
  }

  async function handleScore(round, points) {
    const teamId = localStorage.getItem("teamId");

    if (!teamId) {
      setMessage("Ingen team funnet");
      return;
    }

    if (!points && points !== 0) {
      setMessage("Skriv inn poeng");
      return;
    }

    await submitScore(Number(teamId), round, points);

    const newState = { ...submittedRounds, [round]: true };
    setSubmittedRounds(newState);

    setMessage(`Poeng sendt for runde ${round}`);

    document.getElementById(`r${round}`).value = "";
  }

  return (
    <div className="container">
      <h1>🍺 Fjøset Quiz</h1>

      {message && <p>{message}</p>}

      {/* LOGIN */}
      {!session && (
        <>
          <input
            placeholder="Passord"
            onChange={e => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Start</button>
        </>
      )}

      {/* TEAM */}
      {session && !team && (
        <>
          <h2>Lag navn</h2>
          <input
            placeholder="Skriv lagnavn"
            onChange={e => setTeamName(e.target.value)}
          />
          <button onClick={handleCreateTeam}>Registrer</button>
        </>
      )}

      {/* QUIZ */}
      {team && (
        <>
          <h2>{team.name || team.Name}</h2>

          {[1, 2, 3].map(r => {
            const isSubmitted = submittedRounds[r];

            return (
              <div
                key={r}
                style={{
                  marginBottom: "20px",
                  opacity: isSubmitted ? 0.5 : 1,
                  background: isSubmitted ? "#1a1d24" : "transparent",
                  padding: "12px",
                  borderRadius: "8px"
                }}
              >
                <h3>Runde {r}</h3>

                <input
                  type="number"
                  id={`r${r}`}
                  placeholder="Poeng"
                  disabled={isSubmitted}
                  style={{
                    background: isSubmitted ? "#333" : "",
                    color: isSubmitted ? "#aaa" : ""
                  }}
                />

                <button
                  disabled={isSubmitted}
                  onClick={() => {
                    const val = document.getElementById(`r${r}`).value;
                    handleScore(r, Number(val));
                  }}
                >
                  {isSubmitted ? "Sendt" : "Send inn"}
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}