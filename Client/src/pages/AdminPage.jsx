// client/src/pages/AdminPage.jsx
import React from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* ---------- Helpers ---------- */
function frDate(d) {
  if (!d) return "—";
  const [y, m, da] = String(d).split("-");
  return `${da}/${m}/${y}`;
}

/* ---------------- HEALTH ---------------- */
function HealthCard() {
  const [status, setStatus] = React.useState("…");
  async function check() {
    try {
      const r = await fetch(`${API}/api/health`);
      const j = await r.json();
      setStatus(j.ok ? "Prêt ✅" : "KO ❌");
    } catch {
      setStatus("KO ❌");
    }
  }
  React.useEffect(() => {
    check();
  }, []);
  return (
    <section className="card">
      <h2 className="section-title">🔌 État de l'API</h2>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <b>URL:</b> {API}
        </div>
        <div className={`badge ${status.includes("Prêt") ? "ok" : "ko"}`}>
          {status}
        </div>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn" onClick={check}>
          Re-tester
        </button>
      </div>
    </section>
  );
}

/* ---------------- STUDENTS ---------------- */
function Students() {
  const [all, setAll] = React.useState([]);
  const [filtered, setFiltered] = React.useState([]);

  const [qName, setQName] = React.useState("");
  const [qEmail, setQEmail] = React.useState("");
  const [qPhone, setQPhone] = React.useState("");
  const [qAge, setQAge] = React.useState("");

  async function load() {
    try {
      const r = await fetch(`${API}/api/students`);
      const j = await r.json();
      const arr = Array.isArray(j) ? j : [];
      setAll(arr);
      setFiltered(arr);
    } catch {
      setAll([]);
      setFiltered([]);
    }
  }
  React.useEffect(() => {
    load();
  }, []);

  function applyFilters() {
    const name = qName.trim().toLowerCase();
    const email = qEmail.trim().toLowerCase();
    const phone = qPhone.trim().toLowerCase();
    const age = qAge.trim();

    setFiltered(
      all.filter((s) => {
        const okName =
          !name ||
          String(s.full_name || "")
            .toLowerCase()
            .includes(name);
        const okEmail =
          !email ||
          String(s.email || "")
            .toLowerCase()
            .includes(email);
        const okPhone =
          !phone ||
          String(s.phone || "")
            .toLowerCase()
            .includes(phone);
        const okAge = !age || String(s.age ?? "").trim() === age;
        return okName && okEmail && okPhone && okAge;
      })
    );
  }
  function resetFilters() {
    setQName("");
    setQEmail("");
    setQPhone("");
    setQAge("");
    setFiltered(all);
  }

  async function remove(id) {
    if (!confirm("Supprimer cet élève ?")) return;
    try {
      const r = await fetch(`${API}/api/students/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || r.status);
      }
      load();
    } catch (e) {
      alert("❌ Suppression élève : " + e.message);
    }
  }

  function exportPDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = filtered
      .map(
        (s) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;">${
          s.full_name || ""
        }</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;">${
          s.email || ""
        }</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;">${
          s.phone || "—"
        }</td>
        <td style="padding:6px 10px;border-bottom:1px solid #ddd;text-align:right;">${
          s.age ?? "—"
        }</td>
      </tr>
    `
      )
      .join("");
    win.document.write(`
      <html><head><meta charset="utf-8"><title>Élèves</title></head>
      <body style="font-family:system-ui">
        <h2>Liste des élèves</h2>
        <table style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #000;">Nom</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #000;">Email</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #000;">Téléphone</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #000;">Âge</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#555;margin-top:10px">Export le ${new Date().toLocaleString(
          "fr-FR"
        )}</p>
        <script>window.onload = () => window.print()</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <section className="card">
      <h2 className="section-title">👥 Élèves</h2>

      <div className="row" style={{ gap: 8, alignItems: "stretch" }}>
        <input
          placeholder="Nom"
          value={qName}
          onChange={(e) => setQName(e.target.value)}
          style={{ minWidth: 180 }}
        />
        <input
          placeholder="Email"
          value={qEmail}
          onChange={(e) => setQEmail(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <input
          placeholder="Téléphone"
          value={qPhone}
          onChange={(e) => setQPhone(e.target.value)}
          style={{ minWidth: 160 }}
        />
        <input
          type="number"
          placeholder="Âge"
          value={qAge}
          onChange={(e) => setQAge(e.target.value)}
          style={{ width: 90 }}
        />
        <button className="btn" onClick={applyFilters}>
          Rechercher
        </button>
        <button className="btn-ghost" onClick={resetFilters}>
          Réinitialiser
        </button>
        <button className="btn" onClick={exportPDF}>
          🧾 Exporter PDF
        </button>
      </div>

      <div style={{ marginTop: 8, color: "#9aa2af", fontSize: 14 }}>
        {filtered.length} élève(s) trouvé(s)
      </div>

      <ul className="list" style={{ marginTop: 8 }}>
        {filtered.length === 0 && (
          <li className="item">
            <span style={{ color: "#9aa2af" }}>Aucun résultat.</span>
          </li>
        )}
        {filtered.map((s) => (
          <li key={s.id} className="item">
            <span>
              <b>{s.full_name}</b> — {s.email}
              {s.phone ? ` — ${s.phone}` : ""}
              {s.age != null ? ` — ${s.age} ans` : ""}
            </span>
            <span className="actions">
              <button className="btn btn-danger" onClick={() => remove(s.id)}>
                Supprimer
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- TRAININGS (name only) ---------------- */
function Trainings() {
  const [list, setList] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [edit, setEdit] = React.useState(null);
  const [confirmId, setConfirmId] = React.useState(null);

  async function load() {
    try {
      const r = await fetch(`${API}/api/trainings`);
      const j = await r.json();
      setList(Array.isArray(j) ? j : []);
    } catch {
      setList([]);
    }
  }
  React.useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return alert("Titre obligatoire.");
    try {
      const r = await fetch(`${API}/api/trainings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      setTitle("");
      load();
    } catch (e) {
      alert("❌ Ajout formation : " + e.message);
    }
  }

  async function saveEdit() {
    try {
      const r = await fetch(`${API}/api/trainings/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: edit.title.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      setEdit(null);
      load();
    } catch (e) {
      alert("❌ Modification : " + e.message);
    }
  }

  async function reallyDelete(id) {
    try {
      const r = await fetch(`${API}/api/trainings/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || r.status);
      }
      setConfirmId(null);
      load();
    } catch (e) {
      alert("❌ Suppression : " + e.message);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">📚 Formations</h2>

      <form onSubmit={add} className="form-row">
        <input
          placeholder="Nom de la formation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary">Ajouter</button>
      </form>

      <ul className="list" style={{ marginTop: 10 }}>
        {list.map((t) => (
          <li key={t.id} className="item">
            {edit?.id === t.id ? (
              <>
                <input
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
                <span className="actions">
                  <button className="btn" onClick={saveEdit}>
                    💾 Enregistrer
                  </button>
                  <button className="btn-ghost" onClick={() => setEdit(null)}>
                    Annuler
                  </button>
                </span>
              </>
            ) : (
              <>
                <span>
                  <b>{t.title}</b>
                </span>
                <span className="actions">
                  <button className="btn" onClick={() => setEdit(t)}>
                    ✏️ Modifier
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setConfirmId(t.id)}
                  >
                    Supprimer
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

      {confirmId && (
        <div className="alert" style={{ marginTop: 8 }}>
          <div>Supprimer cette formation ?</div>
          <div className="actions" style={{ marginTop: 8 }}>
            <button
              className="btn btn-danger"
              onClick={() => reallyDelete(confirmId)}
            >
              Oui, supprimer
            </button>
            <button className="btn-ghost" onClick={() => setConfirmId(null)}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------------- SESSIONS (per training) ---------------- */
function Sessions() {
  const [trainings, setTrainings] = React.useState([]);
  const [trainingId, setTrainingId] = React.useState("");
  const [sessions, setSessions] = React.useState([]);
  const [form, setForm] = React.useState({
    start_date: "",
    end_date: "",
    capacity: 20,
  });

  async function loadTrainings() {
    try {
      const r = await fetch(`${API}/api/trainings`);
      const j = await r.json();
      const arr = Array.isArray(j) ? j : [];
      setTrainings(arr);
      if (!trainingId && arr.length) setTrainingId(String(arr[0].id));
    } catch {
      setTrainings([]);
    }
  }
  async function loadSessions(tid) {
    if (!tid) return setSessions([]);
    try {
      const r = await fetch(`${API}/api/trainings/${tid}/sessions`);
      const j = await r.json();
      setSessions(Array.isArray(j) ? j : []);
    } catch {
      setSessions([]);
    }
  }

  React.useEffect(() => {
    loadTrainings();
  }, []);
  React.useEffect(() => {
    loadSessions(trainingId);
  }, [trainingId]);

  async function addSession(e) {
    e.preventDefault();
    if (!trainingId) return alert("Choisis une formation.");
    if (!form.start_date || !form.end_date) return alert("Dates requises.");
    try {
      const r = await fetch(`${API}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_id: Number(trainingId),
          start_date: form.start_date,
          end_date: form.end_date,
          capacity: Number(form.capacity || 20),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || r.status);
      setForm({ start_date: "", end_date: "", capacity: 20 });
      loadSessions(trainingId);
    } catch (e) {
      alert("❌ Ajout session : " + e.message);
    }
  }

  async function removeSession(id) {
    if (!confirm("Supprimer cette session ?")) return;
    try {
      const r = await fetch(`${API}/api/sessions/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 204) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || r.status);
      }
      loadSessions(trainingId);
    } catch (e) {
      alert("❌ Suppression session : " + e.message);
    }
  }

  return (
    <section className="card">
      <h2 className="section-title">📅 Sessions</h2>

      <div className="row" style={{ marginBottom: 8 }}>
        <select
          value={trainingId}
          onChange={(e) => setTrainingId(e.target.value)}
          style={{ maxWidth: 360 }}
        >
          {trainings.length === 0 && (
            <option value="">— Aucune formation —</option>
          )}
          {trainings.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={addSession}
        className="form-row"
        style={{ marginBottom: 12 }}
      >
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
        />
        <input
          type="date"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
        />
        <input
          type="number"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          placeholder="Capacité"
        />
        <button className="btn btn-primary">Ajouter la session</button>
      </form>

      <ul className="list">
        {sessions.length === 0 && (
          <li className="item">
            <span style={{ color: "#9aa2af" }}>
              Aucune session pour cette formation.
            </span>
          </li>
        )}
        {sessions.map((s) => (
          <li key={s.id} className="item">
            <span>
              {frDate(s.start_date)} → {frDate(s.end_date)} • {s.capacity ?? 0}{" "}
              places
            </span>
            <span className="actions">
              <button
                className="btn btn-danger"
                onClick={() => removeSession(s.id)}
              >
                Supprimer
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- APPLICATIONS (admin) ---------------- */
function AdminApplications() {
  const [apps, setApps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/applications`);
      const j = await r.json();
      setApps(Array.isArray(j) ? j : []);
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => {
    load();
  }, []);

  async function setStatus(id, status) {
    const r = await fetch(`${API}/api/admin/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return alert("❌ " + (j.error || r.status));
    load();
  }

  return (
    <section className="card">
      <h2 className="section-title">📥 Candidatures reçues</h2>
      {loading && <p>Chargement…</p>}
      {!loading && apps.length === 0 && (
        <p>Aucune candidature pour le moment.</p>
      )}

      <ul className="list">
        {apps.map((a) => (
          <li key={a.id} className="item" style={{ alignItems: "start" }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <b>{a.student?.full_name}</b> — {a.student?.email}
                {a.student?.phone ? ` — ${a.student.phone}` : ""}
              </div>
              <div style={{ color: "#9aa2af" }}>
                {a.training?.title} •{" "}
                {a.session?.start_date ? frDate(a.session.start_date) : "—"} →{" "}
                {a.session?.end_date ? frDate(a.session.end_date) : "—"}
              </div>
              {a.note && <div>💬 Note : {a.note}</div>}
              <div className="row" style={{ gap: 12 }}>
                {a.resume_url ? (
                  <a href={a.resume_url} target="_blank" rel="noreferrer">
                    📎 CV
                  </a>
                ) : (
                  <span style={{ color: "#9aa2af" }}>CV : —</span>
                )}
                {a.cover_letter_url ? (
                  <a href={a.cover_letter_url} target="_blank" rel="noreferrer">
                    📨 Lettre
                  </a>
                ) : (
                  <span style={{ color: "#9aa2af" }}>Lettre : —</span>
                )}
                <span>
                  Statut :{" "}
                  <b
                    style={{
                      color:
                        a.status === "accepted"
                          ? "#22c55e"
                          : a.status === "refused"
                          ? "#ef4444"
                          : "#e2e8f0",
                    }}
                  >
                    {a.status}
                  </b>
                </span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button
                  className="btn"
                  onClick={() => setStatus(a.id, "accepted")}
                >
                  ✅ Accepter
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => setStatus(a.id, "refused")}
                >
                  ❌ Refuser
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------------- PAGE ---------------- */
export default function AdminPage() {
  return (
    <div className="container stack" style={{ maxWidth: 1000 }}>
      <h1 className="m-0">⚙️ Espace Admin</h1>
      <HealthCard />
      <Trainings />
      <Sessions />
      <Students />
      <AdminApplications />
    </div>
  );
}
