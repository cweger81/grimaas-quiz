import { useState } from "react";
import { login, createTeam, submitScore } from "../api";

export default function QuizPage() {
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [participants, setParticipants] = useState("");
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState("");

  // 🧠 hent sendt runder
  const [submittedRounds, setSubmittedRounds] = useState(() => {
    const saved = localStorage.getItem("submittedRounds");
    return saved ? JSON.parse(saved) : {};
  });

  async function handleStart() {
    const res = await login(password);

    if (!res?.sessionId) {
      setMessage("Feil passord");
      return;
    }

    if (!teamName || !participants) {
      setMessage("Fyll ut alle felt");
      return;
    }

    if (participants < 1 || participants > 6) {
      setMessage("Maks 6 deltakere per lag");
      return;
    }

    const teamRes = await createTeam(
      teamName,
      res.sessionId,
      Number(participants)
    );

    const teamId = teamRes.id || teamRes.Id;

    localStorage.setItem("teamId", teamId);

    setTeam(teamRes);
    setMessage("");
  }

  async function handleScore(round, points) {
    const teamId = localStorage.getItem("teamId");

    if (!teamId) {
      setMessage("Ingen team funnet");
      return;
    }

    if (submittedRounds[round]) {
      setMessage("Du har allerede sendt denne runden");
      return;
    }

    await submitScore(Number(teamId), round, points);

    const updated = {
      ...submittedRounds,
      [round]: true
    };

    setSubmittedRounds(updated);
    localStorage.setItem("submittedRounds", JSON.stringify(updated));

    setMessage(`Poeng sendt for runde ${round}`);
  }

  // 🔐 LOGIN VIEW
  if (!team) {
    return (
      <div className="container">
        <h1>🍺 Fjøset Quiz</h1>

        {message && <p>{message}</p>}

        <input
          placeholder="Lagnavn"
          onChange={e => setTeamName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Antall deltakere (1-6)"
          min="1"
          max="6"
          onChange={e => setParticipants(e.target.value)}
        />

        <input
          placeholder="Passord"
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleStart}>Start quiz</button>
      </div>
    );
  }

  // 🧠 QUIZ VIEW
  return (
    <div className="container">
      <h2>{team.name || team.Name}</h2>

      {[1, 2, 3].map(r => {
        const isSubmitted = submittedRounds[r];

        return (
          <div key={r} style={{ marginBottom: "20px" }}>
            <h3>Runde {r}</h3>

            <input
              type="number"
              id={`r${r}`}
              placeholder="Poeng"
              disabled={isSubmitted}
              style={{
                opacity: isSubmitted ? 0.5 : 1
              }}
            />

            <button
              disabled={isSubmitted}
              style={{
                opacity: isSubmitted ? 0.5 : 1,
                cursor: isSubmitted ? "not-allowed" : "pointer"
              }}
              onClick={() => {
                const val = document.getElementById(`r${r}`).value;
                handleScore(r, Number(val));
              }}
            >
              {isSubmitted ? "Sendt ✔" : "Send inn"}
            </button>
          </div>
        );
      })}

      {message && <p>{message}</p>}
    </div>
  );
}