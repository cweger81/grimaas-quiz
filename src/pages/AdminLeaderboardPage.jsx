import { useEffect, useMemo, useState } from "react";
import { getAdminLeaderboard } from "../api";

function buildCompetitionRanks(teams, accessor) {
  const sorted = [...teams].sort((a, b) => {
    const pointsDiff = accessor(b) - accessor(a);

    if (pointsDiff !== 0) {
      return pointsDiff;
    }

    return a.name.localeCompare(b.name, "no");
  });

  let lastValue = null;
  let lastRank = 0;

  return sorted.map((team, index) => {
    const value = accessor(team);
    const rank = value === lastValue ? lastRank : index + 1;
    lastValue = value;
    lastRank = rank;

    return {
      ...team,
      rank,
      value
    };
  });
}

function RoundSection({ title, teams }) {
  return (
    <section className="leaderboard-section admin-round-leaderboard">
      <h2 className="leaderboard-date">{title}</h2>

      {teams.map(team => {
        const isTop3 = team.rank <= 3;

        return (
          <div
            key={team.id}
            className={`leaderboard-row${isTop3 ? " is-top3" : ""}`}
            style={{
              color:
                team.rank === 1
                  ? "#ffd700"
                  : team.rank === 2
                  ? "#c0c0c0"
                  : team.rank === 3
                  ? "#cd7f32"
                  : "var(--text)"
            }}
          >
            <span>#{team.rank}</span>
            <span className="leaderboard-name">{team.name}</span>
            <span>{team.value}</span>
          </div>
        );
      })}
    </section>
  );
}

export default function AdminLeaderboardPage() {
  const [isAuthorized, setIsAuthorized] = useState(
    () => !!localStorage.getItem("adminPassword")
  );
  const [activeSession, setActiveSession] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!isAuthorized) {
      return undefined;
    }

    async function load() {
      const result = await getAdminLeaderboard();

      if (result.status === 401) {
        localStorage.removeItem("adminPassword");
        setIsAuthorized(false);
        return;
      }

      setActiveSession(result.data?.activeSession || null);
      setTeams(result.data?.teams || []);
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
  }, [isAuthorized]);

  const round1 = useMemo(
    () => buildCompetitionRanks(teams, team => Number(team.rounds[1].points || 0)),
    [teams]
  );
  const round2 = useMemo(
    () => buildCompetitionRanks(teams, team => Number(team.rounds[2].points || 0)),
    [teams]
  );
  const round3 = useMemo(
    () => buildCompetitionRanks(teams, team => Number(team.rounds[3].points || 0)),
    [teams]
  );

  if (!isAuthorized) {
    return (
      <div className="container admin-page">
        <div className="admin-login-card">
          <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
          <h1>Admin leaderboard</h1>
          <p>Logg inn via admin-siden forst.</p>
          <a className="quiz-link-button" href="/quizadmin">
            Ga til admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <img className="brand-logo brand-logo-admin" src="/grimaas-logo.png" alt="Grimaas logo" />
      <h1>Admin leaderboard</h1>
      {activeSession ? (
        <p>Aktiv quiz: {new Date(activeSession.QuizDate).toLocaleDateString("no-NO")}</p>
      ) : (
        <p>Ingen aktiv quiz</p>
      )}

      <div className="leaderboard-shell admin-rounds-shell">
        <RoundSection title="Runde 1" teams={round1} />
        <RoundSection title="Runde 2" teams={round2} />
        <RoundSection title="Runde 3" teams={round3} />
      </div>
    </div>
  );
}
