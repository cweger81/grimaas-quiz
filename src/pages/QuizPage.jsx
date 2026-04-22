import { useEffect, useState } from "react";
import { createTeam, getActiveSession, login, submitScore } from "../api";

function getStorageKey(sessionId, suffix) {
  return `quiz:${sessionId}:${suffix}`;
}

const ACTIVE_SESSION_KEY = "quiz:activeSessionId";

function readStoredJson(key, fallback) {
  const rawValue = localStorage.getItem(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function clearStoredQuizState(targetSessionId) {
  const sessionId = targetSessionId || localStorage.getItem(ACTIVE_SESSION_KEY);

  if (sessionId) {
    localStorage.removeItem(getStorageKey(sessionId, "teamId"));
    localStorage.removeItem(getStorageKey(sessionId, "team"));
    localStorage.removeItem(getStorageKey(sessionId, "participants"));
    localStorage.removeItem(getStorageKey(sessionId, "submittedRounds"));
  }

  localStorage.removeItem(ACTIVE_SESSION_KEY);
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

  useEffect(() => {
    let isMounted = true;

    async function restoreExistingTeam() {
      const activeSession = await getActiveSession();
      const storedSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);

      if (!isMounted) {
        return;
      }

      if (!activeSession?.Id) {
        clearStoredQuizState(storedSessionId);
        return;
      }

      const activeId = String(activeSession.Id);

      if (!storedSessionId || storedSessionId !== activeId) {
        clearStoredQuizState(storedSessionId);
        return;
      }

      const storedTeamId = localStorage.getItem(getStorageKey(activeId, "teamId"));
      const storedTeam = readStoredJson(getStorageKey(activeId, "team"), null);
      const storedParticipants = localStorage.getItem(
        getStorageKey(activeId, "participants")
      );
      const storedRounds = readStoredJson(
        getStorageKey(activeId, "submittedRounds"),
        {}
      );

      if (!storedTeamId || !storedTeam) {
        clearStoredQuizState(activeId);
        return;
      }

      setSessionId(activeSession.Id);
      setTeam(storedTeam);
      setParticipants(
        storedParticipants ||
          String(storedTeam.participantCount || storedTeam.ParticipantCount || "")
      );
      setSubmittedRounds(storedRounds);
      setMessage("Lag og runder ble gjenopprettet for denne quizen.");
    }

    void restoreExistingTeam();

    return () => {
      isMounted = false;
    };
  }, []);

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

    localStorage.setItem(ACTIVE_SESSION_KEY, String(session.sessionId));
    localStorage.setItem(
      getStorageKey(session.sessionId, "teamId"),
      String(nextTeamId)
    );
    localStorage.setItem(
      getStorageKey(session.sessionId, "submittedRounds"),
      JSON.stringify(nextSubmittedRounds)
    );
    localStorage.setItem(
      getStorageKey(session.sessionId, "team"),
      JSON.stringify(teamRes)
    );
    localStorage.setItem(
      getStorageKey(session.sessionId, "participants"),
      String(participantCount)
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

  function handleResetDevice() {
    clearStoredQuizState(String(sessionId || ""));
    setPassword("");
    setTeamName("");
    setParticipants("");
    setTeam(null);
    setSessionId(null);
    setRoundInputs({ 1: "", 2: "", 3: "" });
    setSubmittedRounds({});
    setMessage("Denne enheten er nullstilt for aktiv quiz.");
  }

  if (!team) {
    return (
      <div className="container quiz-page">
        <div className="quiz-shell">
          <div className="quiz-card">
            <p className="quiz-eyebrow">Grimaas Bryggeri</p>
            <h1>Fjøset Quiz</h1>
            <p className="quiz-intro">
              Logg inn laget ditt og send inn poeng fortløpende gjennom kvelden.
            </p>

            {message && <p className="quiz-message">{message}</p>}

            <div className="quiz-form">
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
            </div>

            <button className="quiz-primary-button" onClick={handleStart}>
              Start quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container quiz-page">
      <div className="quiz-shell">
        <div className="quiz-card quiz-card-wide">
          <div className="quiz-header">
            <div>
              <p className="quiz-eyebrow">Lag registrert</p>
              <h2>{team.name || team.Name}</h2>
            </div>

            <div className="quiz-badge">
              {participants} deltakere
            </div>
          </div>

          <div className="quiz-round-grid">
            {[1, 2, 3].map(round => {
              const isSubmitted = submittedRounds[round];

              return (
                <div
                  key={round}
                  className={`quiz-round-card${isSubmitted ? " is-submitted" : ""}`}
                >
                  <p className="quiz-round-label">Runde {round}</p>

                  <input
                    type="number"
                    placeholder="Poeng"
                    value={roundInputs[round]}
                    disabled={isSubmitted}
                    onChange={e =>
                      setRoundInputs(current => ({
                        ...current,
                        [round]: e.target.value
                      }))
                    }
                  />

                  <button
                    className="quiz-primary-button"
                    disabled={isSubmitted}
                    onClick={() => handleScore(round)}
                  >
                    {isSubmitted ? "Sendt" : "Send inn"}
                  </button>
                </div>
              );
            })}
          </div>

          {message && <p className="quiz-message">{message}</p>}

          <button className="quiz-secondary-button" onClick={handleResetDevice}>
            Bytt lag pa denne enheten
          </button>
        </div>
      </div>
    </div>
  );
}
