import { useState } from "react";
import { login, createTeam, submitScore } from "../api";

function getStorageKey(sessionId, suffix) {
  return `quiz:${sessionId}:${suffix}`;
}

export default function QuizPage() {
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [participants, setParticipants] = useState("");
  const [team, setTeam] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState("");
  const [roundInputs, setRoundInputs] = useState({
    1: "",
    2: "",
    3: ""
  });
  const [submittedRounds, setSubmittedRounds] = useState({});

  async function handleStart() {
    if (!teamName.trim() || !participants) {
      setMessage("Fyll ut alle felt");
      return;
    }

    const participantCount = Number(participants);

    if (participantCount < 1 || participantCount > 6) {
      setMessage("Maks 6 deltakere per lag");
      return;
    }

    const session = await login(password);

    if (!session?.sessionId) {
      setMessage("Feil passord");
      return;
    }

    const teamRes = await createTeam(
      teamName.trim(),
      session.sessionId,
      participantCount
    );

    const nextTeamId = teamRes.id || teamRes.Id;
    const nextSubmittedRounds = {};

    localStorage.setItem(
      getStorageKey(session.sessionId, "teamId"),
      String(nextTeamId)
    );
    localStorage.setItem(
      getStorageKey(session.sessionId, "submittedRounds"),
      JSON.stringify(nextSubmittedRounds)
    );

    setSessionId(session.sessionId);
    setSubmittedRounds(nextSubmittedRounds);
    setRoundInputs({ 1: "", 2: "", 3: "" });
    setTeam(teamRes);
    setMessage("");
  }

  async function handleScore(round) {
    if (!sessionId) {
      setMessage("Ingen aktiv quiz funnet");
      return;
    }

    const teamId = localStorage.getItem(getStorageKey(sessionId, "teamId"));
    const points = Number(roundInputs[round]);

    if (!teamId) {
      setMessage("Ingen team funnet");
      return;
    }

    if (submittedRounds[round]) {
      setMessage("Du har allerede sendt denne runden");
      return;
    }

    if (!Number.isFinite(points) || points < 0) {
      setMessage("Skriv inn gyldige poeng");
      return;
    }

    await submitScore(Number(teamId), round, points);

    const updatedRounds = {
      ...submittedRounds,
      [round]: true
    };

    setSubmittedRounds(updatedRounds);
    localStorage.setItem(
      getStorageKey(sessionId, "submittedRounds"),
      JSON.stringify(updatedRounds)
    );
    setMessage(`Poeng sendt for runde ${round}`);
  }

  if (!team) {
    return (
      <div className="container">
        <h1>Fjoset Quiz</h1>

        {message && <p>{message}</p>}

        <input
          placeholder="Lagnavn"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Antall deltakere (1-6)"
          min="1"
          max="6"
          value={participants}
          onChange={e => setParticipants(e.target.value)}
        />

        <input
          placeholder="Passord"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={handleStart}>Start quiz</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>{team.name || team.Name}</h2>

      {[1, 2, 3].map(round => {
        const isSubmitted = submittedRounds[round];

        return (
          <div key={round} style={{ marginBottom: "20px" }}>
            <h3>Runde {round}</h3>

            <input
              type="number"
              placeholder="Poeng"
              value={roundInputs[round]}
              disabled={isSubmitted}
              style={{ opacity: isSubmitted ? 0.5 : 1 }}
              onChange={e =>
                setRoundInputs(current => ({
                  ...current,
                  [round]: e.target.value
                }))
              }
            />

            <button
              disabled={isSubmitted}
              style={{
                opacity: isSubmitted ? 0.5 : 1,
                cursor: isSubmitted ? "not-allowed" : "pointer"
              }}
              onClick={() => handleScore(round)}
            >
              {isSubmitted ? "Sendt" : "Send inn"}
            </button>
          </div>
        );
      })}

      {message && <p>{message}</p>}
    </div>
  );
}
