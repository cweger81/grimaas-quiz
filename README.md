# Grimaas Quiz App

Frontend for the Grimaas Bryggeri live quiz system.

This app is used for:

- team registration for an active quiz
- score submission for round 1, 2, and 3
- tie-breaker answer submission
- public leaderboard
- admin controls and admin leaderboard
- upcoming quiz registration

## Routes

- `/quiz` - quiz player page
- `/quizadmin` - admin controls
- `/adminleaderboard` - admin round-by-round standings
- `/leaderboard` - public leaderboard
- `/quiz-registration` - registration for upcoming quiz dates

## Tech Stack

- React 19
- React Router
- Vite
- ESLint

## Project Structure

```text
src/
|- api.js
|- index.css
|- App.jsx
`- pages/
   |- QuizPage.jsx
   |- AdminPage.jsx
   |- AdminLeaderboardPage.jsx
   |- Leaderboard.jsx
   `- UpcomingRegistrationPage.jsx
```

## Environment

The app expects a Vite API URL:

```env
VITE_API_URL=https://grimaas-quiz-api-bxa6cmacfja0fuc9.norwayeast-01.azurewebsites.net/api
```

Create a local `.env` file if needed.

## Development

Install dependencies:

```powershell
npm install
```

Run locally:

```powershell
npm run dev
```

Lint:

```powershell
npm run lint
```

Production build:

```powershell
npm run build
```

Preview production build:

```powershell
npm run preview
```

## Backend

This frontend talks to the Azure Functions backend in the sibling project `quiz-api`.

Main API areas used by the app:

- quiz session login
- team creation
- score submission
- leaderboard publishing controls
- tie-breaker submission
- upcoming quiz registrations

## Deployment

This repository is connected to Azure Static Web Apps.

Typical deploy flow:

```powershell
git add .
git commit -m "Update quiz app"
git push
```

## Notes

- The public leaderboard only shows rounds that admin has chosen to publish.
- Duplicate team names in the same quiz session are blocked.
- Duplicate score submissions for the same team and round are blocked.
- Upcoming quiz registration uses email for contact.
- Admin leaderboard supports round-by-round reading and a total board.
