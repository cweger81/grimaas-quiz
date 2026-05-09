import { useEffect, useState } from "react";
import {
  createTeam,
  getActiveSession,
  getUpcomingDates,
  login,
  submitScore,
  submitTieBreaker
} from "../api";

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
    localStorage.removeItem(getStorageKey(sessionId, "tieBreakerAnswer"));
    localStorage.removeItem(getStorageKey(sessionId, "tieBreakerSubmitted"));
  }

  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

function parsePoints(value) {
  const normalized = value.replace(",", ".").trim();
  const points = Number(normalized);

  if (!normalized || !Number.isFinite(points) || points < 0) {
    return null;
  }

  return points;
}

function parseQuizFull(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "ja" || normalized === "1" || normalized === "true";
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
  const [tieBreakerAnswer, setTieBreakerAnswer] = useState("");
  const [tieBreakerSubmitted, setTieBreakerSubmitted] = useState(false);
  const [upcomingDates, setUpcomingDates] = useState([]);

  function formatDate(date) {
    return new Date(date).toLocaleDateString("no-NO", {
      weekday: "long",
      day: "2-digit",
      month: "long"
    });
  }

  function isQuizFull(item) {
    return parseQuizFull(item?.QuizFull ?? item?.quizFull);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadUpcomingDates() {
      const upcoming = await getUpcomingDates();

      if (!isMounted) {
        return;
      }

      setUpcomingDates(upcoming);
    }

    void loadUpcomingDates();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const storedTieBreakerAnswer =
        localStorage.getItem(getStorageKey(activeId, "tieBreakerAnswer")) || "";
      const storedTieBreakerSubmitted =
        localStorage.getItem(getStorageKey(activeId, "tieBreakerSubmitted")) === "true";

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
      setTieBreakerAnswer(storedTieBreakerAnswer);
      setTieBreakerSubmitted(storedTieBreakerSubmitted);
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

    if (!teamRes.ok) {
      setMessage(teamRes.data?.error || "Kunne ikke registrere laget");
      return;
    }

    const createdTeam = teamRes.data;
    const nextTeamId = createdTeam.id || createdTeam.Id;
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
      JSON.stringify(createdTeam)
    );
    localStorage.setItem(
      getStorageKey(session.sessionId, "participants"),
      String(participantCount)
    );
    localStorage.removeItem(getStorageKey(session.sessionId, "tieBreakerAnswer"));
    localStorage.removeItem(getStorageKey(session.sessionId, "tieBreakerSubmitted"));

    setSessionId(session.sessionId);
    setSubmittedRounds(nextSubmittedRounds);
    setTieBreakerAnswer("");
    setTieBreakerSubmitted(false);
    setRoundInputs({ 1: "", 2: "", 3: "" });
    setTeam(createdTeam);
    setMessage("");
  }

  async function handleScore(round) {
    if (!sessionId) {
      setMessage("Ingen aktiv quiz funnet");
      return;
    }

    const teamId = localStorage.getItem(getStorageKey(sessionId, "teamId"));
    const points = parsePoints(roundInputs[round]);

    if (!teamId) {
      setMessage("Ingen team funnet");
      return;
    }

    if (submittedRounds[round]) {
      setMessage("Du har allerede sendt denne runden");
      return;
    }

    if (points === null) {
      setMessage("Skriv inn gyldige poeng, for eksempel 13,5");
      return;
    }

    const result = await submitScore(Number(teamId), round, points);

    if (!result.ok) {
      setMessage(result.data?.message || "Kunne ikke sende poeng");
      return;
    }

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

  async function handleTieBreakerSubmit() {
    if (!sessionId) {
      setMessage("Ingen aktiv quiz funnet");
      return;
    }

    const teamId = localStorage.getItem(getStorageKey(sessionId, "teamId"));
    const answer = tieBreakerAnswer.trim();

    if (!teamId || !answer) {
      setMessage("Skriv inn et utslagssvar");
      return;
    }

    const result = await submitTieBreaker(Number(teamId), answer);

    if (!result.ok) {
      setMessage(result.data?.message || "Kunne ikke sende utslagssvar");
      return;
    }

    localStorage.setItem(getStorageKey(sessionId, "tieBreakerAnswer"), answer);
    localStorage.setItem(getStorageKey(sessionId, "tieBreakerSubmitted"), "true");
    setTieBreakerSubmitted(true);
    setMessage("Utslagssvar sendt inn");
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
    setTieBreakerAnswer("");
    setTieBreakerSubmitted(false);
    setMessage("Denne enheten er nullstilt for aktiv quiz.");
  }

  function renderLeaderboardLink() {
    return (
      <a
        className="quiz-link-button"
        href="/leaderboard"
        target="_blank"
        rel="noreferrer"
      >
        Poengtavle
      </a>
    );
  }

  function renderUpcomingDates() {
    if (upcomingDates.length === 0) {
      return (
        <div className="quiz-upcoming-card">
          <p className="quiz-eyebrow">Neste quizkvelder</p>
          <p className="quiz-upcoming-empty">Nye datoer kommer snart.</p>
        </div>
      );
    }

    return (
      <div className="quiz-upcoming-card">
        <p className="quiz-eyebrow">Neste quizkvelder</p>
        <div className="quiz-upcoming-list">
          {upcomingDates.map(item => {
            const dateValue = (item.QuizDate || item.quizDate || "").slice(0, 10);
            const full = isQuizFull(item);
            const content = (
              <>
                <span>{formatDate(item.QuizDate || item.quizDate)}</span>
                {full ? <span className="quiz-upcoming-status">Fullt!</span> : null}
              </>
            );

            if (full) {
              return (
                <div
                  key={item.Id || item.id}
                  className="quiz-upcoming-item quiz-upcoming-item-full"
                >
                  {content}
                </div>
              );
            }

            return (
              <a
                key={item.Id || item.id}
                className="quiz-upcoming-item quiz-upcoming-link"
                href={`/quiz-registration?date=${encodeURIComponent(dateValue)}`}
                target="_blank"
                rel="noreferrer"
              >
                {content}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container quiz-page">
        <div className="quiz-shell">
          <div className="quiz-card">
            <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
            <p className="quiz-eyebrow">Grimaas Bryggeri</p>
            <h1>Fjoset Quiz</h1>
            <p className="quiz-intro">
              Registrer laget ditt og send inn poeng etter hver runde. Passordet star pa quiz-arket.
            </p>

            {message ? <p className="quiz-message">{message}</p> : null}

            <div className="quiz-form">
              <input
                placeholder="Lagnavn"
                value={teamName}
                onChange={event => setTeamName(event.target.value)}
              />

              <input
                type="number"
                placeholder="Antall deltakere (1-6)"
                min="1"
                max="6"
                value={participants}
                onChange={event => setParticipants(event.target.value)}
              />

              <input
                placeholder="Passord"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
            </div>

            <div className="quiz-button-row">
              <button className="quiz-primary-button" onClick={handleStart}>
                Registrer lag
              </button>

              {renderLeaderboardLink()}
            </div>

            {renderUpcomingDates()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container quiz-page">
      <div className="quiz-shell">
        <div className="quiz-card quiz-card-wide">
          <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
          <div className="quiz-header">
            <div>
              <p className="quiz-eyebrow">Lag registrert</p>
              <h2>{team.name || team.Name}</h2>
            </div>

            <div className="quiz-badge">{participants} deltakere</div>
          </div>

          <div className="quiz-round-grid">
            {[1, 2, 3].map(round => {
              const isSubmitted = submittedRounds[round];

              return (
                <div
                  key={round}
                  className={`quiz-round-card${isSubmitted ? " is-submitted" : ""}`}
                >
                  <p className="quiz-round-kicker">Poengregistrering</p>
                  <p className="quiz-round-label">Runde {round}</p>

                  <input
                    type="number"
                    placeholder="Poeng"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={roundInputs[round]}
                    disabled={isSubmitted}
                    onChange={event =>
                      setRoundInputs(current => ({
                        ...current,
                        [round]: event.target.value
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

          <div className="quiz-tiebreaker-card">
            <p className="quiz-round-kicker">Utslagssporsmal</p>
            <p className="quiz-tiebreaker-help">
              Skriv inn svaret deres her. Dette brukes hvis lag ender likt.
            </p>
            <textarea
              className="quiz-textarea"
              placeholder="Skriv utslagssvaret her"
              value={tieBreakerAnswer}
              disabled={tieBreakerSubmitted}
              onChange={event => setTieBreakerAnswer(event.target.value)}
            />
            <button
              className="quiz-primary-button"
              disabled={tieBreakerSubmitted}
              onClick={handleTieBreakerSubmit}
            >
              {tieBreakerSubmitted ? "Utslagssvar sendt" : "Send utslagssvar"}
            </button>
          </div>

          {message ? <p className="quiz-message">{message}</p> : null}

          {renderLeaderboardLink()}

          {renderUpcomingDates()}

          <button className="quiz-secondary-button" onClick={handleResetDevice}>
            Bytt lag pa denne enheten
          </button>
        </div>
      </div>
    </div>
  );
}
