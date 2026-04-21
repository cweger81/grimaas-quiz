import { useEffect, useState } from "react";
import { getLeaderboard } from "../api";

export default function Leaderboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await getLeaderboard();
      setData(res);
    };

    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  // 📅 grupper per dato
  function groupByDate(data) {
    const groups = {};

    data.forEach(item => {
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

    // 🏆 sorter per dato
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => b.total - a.total);
    });

    return groups;
  }

  const grouped = groupByDate(data);

  return (
    <div className="container">
      <h1>🏆 Leaderboard</h1>

      {Object.entries(grouped).map(([date, teams]) => (
        <div key={date} style={{ marginBottom: "40px" }}>
          <h2 style={{ borderBottom: "2px solid #444", paddingBottom: "5px" }}>
            {date}
          </h2>

          {teams.map((t, i) => {
            const isTop3 = i < 3;

            return (
              <div
                key={t.id}
                style={{
                  fontSize: isTop3 ? "22px" : "18px",
                  fontWeight: isTop3 ? "bold" : "normal",
                  color:
                    i === 0
                      ? "#ffd700"   // 🥇 gull
                      : i === 1
                      ? "#c0c0c0"   // 🥈 sølv
                      : i === 2
                      ? "#cd7f32"   // 🥉 bronse
                      : "#fff",
                  marginTop: "8px"
                }}
              >
                #{i + 1} {t.name} - {t.total}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}