import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import QuizPage from "./pages/QuizPage";
import AdminPage from "./pages/AdminPage";
import Leaderboard from "./pages/Leaderboard";
import UpcomingRegistrationPage from "./pages/UpcomingRegistrationPage";
import AdminLeaderboardPage from "./pages/AdminLeaderboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/quiz" />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz-registration" element={<UpcomingRegistrationPage />} />
        <Route path="/quizadmin" element={<AdminPage />} />
        <Route path="/adminleaderboard" element={<AdminLeaderboardPage />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
