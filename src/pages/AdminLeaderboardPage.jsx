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
    () =>
      buildCompetitionRanks(
        teams,
        team => Number(team.rounds[1].points || 0) + Number(team.rounds[2].points || 0)
      ),
    [teams]
  );
  const round3 = useMemo(
    () =>
      buildCompetitionRanks(
        teams,
        team =>
          Number(team.rounds[1].points || 0) +
          Number(team.rounds[2].points || 0) +
          Number(team.rounds[3].points || 0) +
          Number(team.totalAdjustment || 0)
      ),
    [teams]
  );

  const rows = teams.map(team => ({
    team,
    round1: round1.find(item => item.id === team.id),
    round2: round2.find(item => item.id === team.id),
    round3: round3.find(item => item.id === team.id)
  }));

  if (!isAuthorized) {
    return (
      <div className="container admin-page">
        <div className="admin-login-card">
          <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
          <h1>Admin leaderboard</h1>
          <p>Logg inn via admin-siden først.</p>
          <a className="quiz-link-button" href="/quizadmin">
            Gå til admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container admin-page">
      <img className="brand-logo brand-logo-admin" src="/grimaas-logo.png" alt="Grimaas logo" />
      <h1>Admin leaderboard</h1>
      {activeSession ? <p>Aktiv quiz: {new Date(activeSession.QuizDate).toLocaleDateString("no-NO")}</p> : <p>Ingen aktiv quiz</p>}

      <div className="admin-leaderboard-table">
        <div className="admin-leaderboard-head">Lag</div>
        <div className="admin-leaderboard-head">Runde 1</div>
        <div className="admin-leaderboard-head">Runde 2</div>
        <div className="admin-leaderboard-head">Runde 3</div>

        {rows.map(({ team, round1: r1, round2: r2, round3: r3 }) => (
          <div key={team.id} className="admin-leaderboard-row">
            <div className="admin-leaderboard-cell admin-leaderboard-team">
              <strong>{team.name}</strong>
            </div>
            <div className="admin-leaderboard-cell">
              #{r1?.rank ?? "-"} · {r1?.value ?? 0}
            </div>
            <div className="admin-leaderboard-cell">
              #{r2?.rank ?? "-"} · {r2?.value ?? 0}
            </div>
            <div className="admin-leaderboard-cell">
              #{r3?.rank ?? "-"} · {r3?.value ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
