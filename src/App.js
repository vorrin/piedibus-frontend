import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function App() {
  const [attendance, setAttendance] = useState([]);
  const [dayId, setDayId] = useState(null);
  const [date, setDate] = useState("");
  const [days, setDays] = useState([]);
  const [viewingPast, setViewingPast] = useState(false);
  const [kidsChanged, setKidsChanged] = useState(false);

  const API = process.env.REACT_APP_API_URL.replace(/\/$/, "");

  // ------------------ Functions ------------------

  const refreshAttendance = useCallback(() => {
    axios.get(`${API}/attendance/today`).then((res) => {
      setViewingPast(false);
      setDayId(res.data.dayId);
      setDate(res.data.date);
      setAttendance(res.data.attendance || []);
    });
  }, [API]);

  const loadDays = useCallback(() => {
    axios.get(`${API}/days`).then((res) => setDays(res.data));
  }, [API]);

  const loadAttendanceForDay = (id) => {
    if (!id) return;
    axios.get(`${API}/attendance/by-day/${id}`).then((res) => {
      setViewingPast(true);
      setDayId(res.data.dayId);
      setDate(res.data.date);
      setAttendance(res.data.attendance || []);
    });
  };

  const togglePresence = (kid) => {
    if (viewingPast) return; // read-only in history
    axios
      .post(`${API}/attendance/mark`, {
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
  };

  // ------------------ Effects ------------------

  useEffect(() => {
    refreshAttendance();
    loadDays();
  }, [refreshAttendance, loadDays]);

  // ------------------ Render ------------------

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>
        {viewingPast
          ? `Viewing history: ${date}`
          : `Attendance for today: ${date}`}
      </h2>

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

      {/* ------------------ Attendance List ------------------ */}
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

      {/* ------------------ Add / Manage Kids ------------------ */}
      {!viewingPast && (
        <>
          <AddKid
            API={API}
            onAdded={() => {
              refreshAttendance();
              setKidsChanged((c) => !c);
            }}
          />
          <ManageKids
            API={API}
            onDeleted={() => {
              refreshAttendance();
              setKidsChanged((c) => !c);
            }}
            triggerReload={kidsChanged}
          />
        </>
      )}
    </div>
  );
}

// ------------------ AddKid ------------------

function AddKid({ onAdded, API }) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    axios.post(`${API}/kids`, { name }).then(() => {
      setName("");
      if (onAdded) onAdded();
    });
  };

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

// ------------------ ManageKids ------------------

function ManageKids({ onDeleted, API, triggerReload }) {
  const [kids, setKids] = useState([]);

  const loadKids = useCallback(() => {
    axios.get(`${API}/kids`).then((res) => setKids(res.data));
  }, [API]);

  const deleteKid = (id) => {
    if (!window.confirm("Are you sure you want to delete this kid?")) return;
    axios.delete(`${API}/kids/${id}`).then(() => {
      loadKids();
      if (onDeleted) onDeleted();
    });
  };

  useEffect(() => {
    loadKids();
  }, [loadKids, triggerReload]);

 return (
  <div style={{ padding: 20, fontFamily: "sans-serif" }}>
    {/* --- Header: Today / Past Date --- */}
    <h2>
      {viewingPast
        ? `Viewing history: ${date}`
        : `Attendance for today: ${date}`}
    </h2>

    {/* --- Select past day --- */}
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

    {/* ------------------ Attendance List ------------------ */}
    {!viewingPast && attendance.length > 0 && (
      <div style={{ marginBottom: 20 }}>
        <h3>Mark Attendance for Today</h3>
        {attendance.map((kid) => (
          <div
            key={kid.kid_id}
            onClick={() => togglePresence(kid)}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 6,
              cursor: "pointer",
              border: "1px solid #ccc",
              background: kid.present ? "#d4ffd4" : "#ffe9e9",
            }}
          >
            {kid.name} — {kid.present ? "✅ Present" : "⬜ Absent"}
          </div>
        ))}
      </div>
    )}

    {/* ------------------ Add / Manage Kids ------------------ */}
    {!viewingPast && (
      <>
        <AddKid
          API={API}
          onAdded={() => {
            refreshAttendance();
            setKidsChanged((c) => !c);
          }}
        />
        <ManageKids
          API={API}
          onDeleted={() => {
            refreshAttendance();
            setKidsChanged((c) => !c);
          }}
          triggerReload={kidsChanged}
        />
      </>
    )}
  </div>
);
}
