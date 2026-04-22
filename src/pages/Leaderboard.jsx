import { useEffect, useState } from "react";
import { getLeaderboard } from "../api";

export default function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await getLeaderboard();
      setData(res);
    };

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
  }, []);

  function groupByDate(items) {
    const groups = {};

    items.forEach(item => {
      const date = new Date(item.date).toLocaleDateString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(item);
    });

    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => b.total - a.total);
    });

    return groups;
  }

  const grouped = groupByDate(data);

  return (
    <div className="container leaderboard-page">
      <div className="leaderboard-shell">
        <p className="quiz-eyebrow">Poengtavle</p>


        {Object.entries(grouped).map(([date, teams]) => (
          <section key={date} className="leaderboard-section">
            <h2 className="leaderboard-date">{date}</h2>

            {teams.map((team, index) => {
              const isTop3 = index < 3;

              return (
                <div
                  key={team.id}
                  className={`leaderboard-row${isTop3 ? " is-top3" : ""}`}
                  style={{
                    color:
                      index === 0
                        ? "#ffd700"
                        : index === 1
                        ? "#c0c0c0"
                        : index === 2
                        ? "#cd7f32"
                        : "var(--text)"
                  }}
                >
                  <span>#{index + 1}</span>
                  <span className="leaderboard-name">{team.name}</span>
                  <span>{team.total}</span>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
