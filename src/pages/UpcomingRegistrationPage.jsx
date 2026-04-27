import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { registerUpcomingTeam } from "../api";

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("no-NO", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export default function UpcomingRegistrationPage() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") || "";
  const [teamName, setTeamName] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [quizDate, setQuizDate] = useState(initialDate);
  const [contactPerson, setContactPerson] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const formattedDate = useMemo(() => formatDateLabel(quizDate), [quizDate]);

  async function handleSubmit() {
    if (
      !teamName.trim() ||
      !participantCount ||
      !quizDate ||
      !contactPerson.trim() ||
      !phoneNumber.trim()
    ) {
      setMessage("Fyll ut alle feltene.");
      return;
    }

    const count = Number(participantCount);

    if (!Number.isInteger(count) || count < 1 || count > 20) {
      setMessage("Antall deltakere må være mellom 1 og 20.");
      return;
    }

    const result = await registerUpcomingTeam({
      teamName: teamName.trim(),
      participantCount: count,
      quizDate,
      contactPerson: contactPerson.trim(),
      phoneNumber: phoneNumber.trim()
    });

    if (!result.ok) {
      setMessage("Kunne ikke registrere laget akkurat nå.");
      return;
    }

    setIsSubmitted(true);
    setMessage("Påmeldingen er registrert. Vi sees på quiz!");
  }

  return (
    <div className="container quiz-page">
      <div className="quiz-shell">
        <div className="quiz-card">
          <img className="brand-logo" src="/grimaas-logo.png" alt="Grimaas logo" />
          <p className="quiz-eyebrow">Påmelding neste quiz</p>
          <h1>Registrer lag</h1>
          {formattedDate && <p className="quiz-intro">{formattedDate}</p>}

          {message && <p className="quiz-message">{message}</p>}

          {!isSubmitted && (
            <>
              <div className="quiz-form">
                <input
                  placeholder="Lagnavn"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Antall deltagere"
                  min="1"
                  max="20"
                  value={participantCount}
                  onChange={e => setParticipantCount(e.target.value)}
                />

                <input
                  type="date"
                  value={quizDate}
                  onChange={e => setQuizDate(e.target.value)}
                />

                <input
                  placeholder="Kontaktperson"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                />

                <input
                  placeholder="Telefonnummer"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>

              <button className="quiz-primary-button" onClick={handleSubmit}>
                Send påmelding
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
