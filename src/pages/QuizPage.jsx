import { useState } from "react";
import { login, createTeam, submitScore } from "../api";

export default function QuizPage() {
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [participants, setParticipants] = useState("");
  const [team, setTeam] = useState(null);
  const [message, setMessage] = useState("");

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
    await submitScore(Number(teamId), round, points);
    setMessage(`Poeng sendt for runde ${round}`);
  }

  if (!team) {
    return (
      <div className="container">
        <h1>🍺 Fjøset Quiz</h1>
        {message && <p>{message}</p>}

        <input placeholder="Lagnavn" onChange={e => setTeamName(e.target.value)} />

        <input
          type="number"
          placeholder="Antall deltakere (1-6)"
          min="1"
          max="6"
          onChange={e => setParticipants(e.target.value)}
        />

        <input placeholder="Passord" onChange={e => setPassword(e.target.value)} />

        <button onClick={handleStart}>Start quiz</button>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>{team.name || team.Name}</h2>

      {[1, 2, 3].map(r => (
        <div key={r}>
          <h3>Runde {r}</h3>
          <input type="number" id={`r${r}`} />
          <button onClick={() => {
            const val = document.getElementById(`r${r}`).value;
            handleScore(r, Number(val));
          }}>
            Send inn
          </button>
        </div>
      ))}
    </div>
  );
}