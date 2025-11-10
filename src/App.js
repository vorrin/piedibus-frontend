import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [attendance, setAttendance] = useState([]);
  const [dayId, setDayId] = useState(null);
  const [date, setDate] = useState("");
  const [days, setDays] = useState([]); // ✅ store history list
  const [viewingPast, setViewingPast] = useState(false);

  useEffect(() => {
    refreshAttendance();
    loadDays();
  }, []);

  function loadDays() {
    axios.get(`${process.env.REACT_APP_API_URL}/days`).then((res) => {
      setDays(res.data);
    });
  }

  function refreshAttendance() {
    axios.get(`${process.env.REACT_APP_API_URL}/today`).then((res) => {
      setViewingPast(false);
      setDayId(res.data.dayId);
      setDate(res.data.date);
      setAttendance(res.data.attendance || []);
    });
  }

  function loadAttendanceForDay(id) {
    axios.get(`${process.env.REACT_APP_API_URL}/${id}`).then((res) => {
      setViewingPast(true);
      setDayId(res.data.dayId);
      setDate(res.data.date);
      setAttendance(res.data.attendance || []);
    });
  }

  function togglePresence(kid) {
    if (viewingPast) return; // read-only in history mode

    axios
      .post(`${process.env.REACT_APP_API_URL}/mark`, {
        dayId,
        kidId: kid.kid_id,
        present: !kid.present,
      })
      .then(() => {
        setAttendance((a) =>
          a.map((k) =>
            k.kid_id === kid.kid_id ? { ...k, present: !k.present } : k
          )
        );
      });
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>
        {viewingPast
          ? `Viewing history: ${date}`
          : `Attendance for today: ${date}`}
      </h2>

      {/* ✅ Select menu for days */}
      <select onChange={(e) => loadAttendanceForDay(e.target.value)}>
        <option value="">-- View past dates --</option>
        {days.map((d) => (
          <option key={d.id} value={d.id}>
            {d.date}
          </option>
        ))}
      </select>

      <button onClick={refreshAttendance} style={{ marginLeft: 10 }}>
        Today
      </button>

      <br />
      <br />

      {attendance.map((kid) => (
        <div
          key={kid.kid_id}
          onClick={() => togglePresence(kid)}
          style={{
            padding: 12,
            marginBottom: 8,
            borderRadius: 6,
            cursor: viewingPast ? "not-allowed" : "pointer",
            border: "1px solid #ccc",
            background: kid.present ? "#d4ffd4" : "#ffe9e9",
            opacity: viewingPast ? 0.7 : 1,
          }}
        >
          {kid.name} — {kid.present ? "✅ Present" : "⬜ Absent"}
        </div>
      ))}

      {!viewingPast && <AddKid onAdded={refreshAttendance} />}
    </div>
  );
}

function AddKid({ onAdded }) {
  const [name, setName] = useState("");

  function submit() {
    if (!name.trim()) return;
    axios.post(`${process.env.REACT_APP_API_URL}/kids`, { name }).then(() => {
      setName("");
      onAdded();
    });
  }

  
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Add Kid</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Kid name"
      />
      <button onClick={submit}>Add</button>
    </div>
  );
}
