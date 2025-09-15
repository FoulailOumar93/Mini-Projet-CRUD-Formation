import React, { useEffect, useState, useMemo } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

/* =============== Thème clair/sombre =============== */
function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={
        theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
      }
      style={{ marginLeft: "auto" }}
    >
      {theme === "dark" ? "☀️ Clair" : "🌙 Sombre"}
    </button>
  );
}

/* =============== Health/ping API =============== */
function HealthCard() {
  const [status, setStatus] = useState("…");
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/health`, { cache: "no-store" });
        const j = await r.json();
        if (alive) setStatus(j.ok ? "Prêt ✅" : "KO ❌");
      } catch {
        if (alive) setStatus("KO ❌");
      }
    })();
    return () => (alive = false);
  }, []);
  return (
    <div className="badge" style={{ display: "inline-flex", gap: 8 }}>
      <b>API:</b> <span>{API}</span> — <b>Statut:</b> <span>{status}</span>
    </div>
  );
}

/* =============== Utils =============== */
function frDate(d) {
  if (!d) return "—";
  const [y, m, da] = String(d).split("-");
  return `${da}/${m}/${y}`;
}

function StatusBadge({ status }) {
  const label =
    status === "accepted"
      ? "Acceptée"
      : status === "refused"
      ? "Refusée"
      : "En attente";
  return <span className={`status ${status || "pending"}`}>{label}</span>;
}

/* =================================================
   PAGE CANDIDAT
   ================================================= */
export default function CandidatePage() {
  /* ---- Données ---- */
  const [trainings, setTrainings] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  /* ---- Formulaire candidature ---- */
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    training_id: "",
    session_id: "",
    note: "", // facultatif
    resume: null, // obligatoire
    cover_letter: null, // obligatoire
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---- Suivi candidature ---- */
  const [trackEmail, setTrackEmail] = useState("");
  const [myApps, setMyApps] = useState([]);
  const [statusError, setStatusError] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);

  /* ========== Charger formations ========== */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/trainings`, { cache: "no-store" });
        const j = await r.json();
        if (alive) setTrainings(Array.isArray(j) ? j : []);
      } catch {
        if (alive) setTrainings([]);
      }
    })();
    return () => (alive = false);
  }, []);

  /* ========== Charger sessions (avec fallback) ========== */
  useEffect(() => {
    let alive = true;

    async function loadSessions() {
      if (!form.training_id) {
        setSessions([]);
        return;
      }
      setLoadingSessions(true);
      try {
        // 1) Endpoint par formation
        const r1 = await fetch(
          `${API}/api/trainings/${form.training_id}/sessions`,
          { cache: "no-store" }
        );
        const s1 = await r1.json();

        if (alive && Array.isArray(s1) && s1.length > 0) {
          setSessions(s1);
          return;
        }

        // 2) Fallback: toutes les sessions puis filtre
        const r2 = await fetch(`${API}/api/sessions`, { cache: "no-store" });
        const s2 = await r2.json();
        if (alive && Array.isArray(s2)) {
          const filtered = s2.filter(
            (ss) => String(ss.training_id) === String(form.training_id)
          );
          setSessions(filtered);
        }
      } catch {
        if (alive) setSessions([]);
      } finally {
        if (alive) setLoadingSessions(false);
      }
    }

    loadSessions();
    return () => (alive = false);
  }, [form.training_id]);

  /* ========== Envoi candidature ========== */
  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      if (
        !form.full_name?.trim() ||
        !form.email?.trim() ||
        !form.training_id ||
        !form.session_id
      ) {
        alert("⚠️ Nom, email, formation et session sont requis.");
        setSubmitting(false);
        return;
      }
      if (!form.resume || !form.cover_letter) {
        alert("⚠️ CV et lettre de motivation (fichier) sont obligatoires.");
        setSubmitting(false);
        return;
      }

      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) data.append(k, v);
      });

      const r = await fetch(`${API}/api/public/apply`, {
        method: "POST",
        body: data,
      });
      const j = await r.json().catch(() => ({}));

      if (!r.ok) {
        alert("❌ Erreur: " + (j.error || r.status));
      } else {
        setMessage(j.message || "✅ Candidature envoyée !");
        setForm({
          full_name: "",
          email: "",
          phone: "",
          training_id: "",
          session_id: "",
          note: "",
          resume: null,
          cover_letter: null,
        });
      }
    } catch (e) {
      alert("❌ Réseau/serveur: " + String(e));
    } finally {
      setSubmitting(false);
    }
  }

  /* ========== Suivi par email ========== */
  async function checkMyStatus() {
    setStatusError("");
    setLoadingStatus(true);
    setMyApps([]);
    try {
      const email = String(trackEmail).trim().toLowerCase();
      if (!email) throw new Error("Veuillez entrer un email.");
      const r = await fetch(
        `${API}/api/public/status?email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.status);
      setMyApps(Array.isArray(j) ? j : []);
    } catch (e) {
      setStatusError(String(e.message || e));
    } finally {
      setLoadingStatus(false);
    }
  }

  /* ========== Tri sessions ========== */
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) =>
      String(a.start_date || "").localeCompare(String(b.start_date || ""))
    );
  }, [sessions]);

  return (
    <div className="container stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1
          className="m-0"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ fontSize: 24 }}>🧾</span> Espace Candidat
        </h1>
        <ThemeToggle />
      </div>

      <HealthCard />

      {/* ================= Candidature ================= */}
      <section className="card">
        <h2 className="section-title">📩 Candidature</h2>
        {message && <p className="alert success">{message}</p>}

        <form onSubmit={submit} className="stack">
          <input
            placeholder="Nom complet"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            placeholder="Téléphone (ex: 06 12 34 56 78)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <select
            value={form.training_id}
            onChange={(e) =>
              setForm({ ...form, training_id: e.target.value, session_id: "" })
            }
          >
            <option value="">-- Formation --</option>
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <div className="row" style={{ gap: 8 }}>
            <select
              value={form.session_id}
              onChange={(e) => setForm({ ...form, session_id: e.target.value })}
              disabled={!form.training_id || loadingSessions}
              style={{ flex: 1, minWidth: 260 }}
            >
              <option value="">
                {loadingSessions
                  ? "Chargement des sessions…"
                  : form.training_id
                  ? "-- Session --"
                  : "Choisissez d’abord une formation"}
              </option>
              {sortedSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.start_date_fr || frDate(s.start_date)} →{" "}
                  {s.end_date_fr || frDate(s.end_date)}
                </option>
              ))}
            </select>
            {form.training_id &&
              !loadingSessions &&
              sortedSessions.length === 0 && (
                <span className="muted" style={{ fontSize: 13 }}>
                  Aucune session disponible pour cette formation.
                </span>
              )}
          </div>

          <textarea
            placeholder="Message (facultatif)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={5}
          />

          <div className="muted" style={{ marginTop: -4 }}>
            📎 Obligatoire : CV et Lettre de motivation (PDF/DOC)
          </div>

          <label style={{ fontSize: 14, marginTop: 6 }}>CV (PDF/DOC) *</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setForm({ ...form, resume: e.target.files[0] })}
          />

          <label style={{ fontSize: 14, marginTop: 6 }}>
            Lettre de motivation (PDF/DOC) *
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setForm({ ...form, cover_letter: e.target.files[0] })
            }
          />

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? "Envoi…" : "Envoyer ma candidature"}
            </button>
          </div>
        </form>
      </section>

      {/* ================= Suivi candidature ================= */}
      <section className="card">
        <h2 className="section-title">📋 Suivi de ma candidature</h2>

        <div className="row" style={{ margin: "8px 0" }}>
          <input
            placeholder="Votre email (utilisé pour la candidature)"
            value={trackEmail}
            onChange={(e) => setTrackEmail(e.target.value)}
            style={{ flex: 1, minWidth: 260 }}
          />
          <button className="btn" onClick={checkMyStatus}>
            Vérifier
          </button>
        </div>

        {loadingStatus && <p>Chargement…</p>}
        {statusError && (
          <p
            className="alert"
            style={{
              color: "var(--danger)",
              background: "color-mix(in sRGB, var(--danger) 8%, var(--card))",
              border:
                "1px solid color-mix(in sRGB, var(--danger) 35%, var(--border))",
            }}
          >
            Erreur : {String(statusError)}
          </p>
        )}

        {!loadingStatus && !statusError && (
          <>
            {myApps.length === 0 ? (
              <p className="muted">
                Aucune candidature trouvée pour cet email.
              </p>
            ) : (
              <ul className="list">
                {myApps.map((a) => (
                  <li
                    key={a.id}
                    className="item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {a.training?.title} <StatusBadge status={a.status} />
                    </div>
                    <div className="muted">
                      Session :{" "}
                      {a.session?.start_date_fr ||
                        frDate(a.session?.start_date)}{" "}
                      → {a.session?.end_date_fr || frDate(a.session?.end_date)}
                    </div>
                    {a.decision_message && (
                      <div
                        style={{
                          color:
                            a.status === "accepted"
                              ? "var(--ok)"
                              : "var(--danger)",
                          fontWeight: 600,
                        }}
                      >
                        {a.decision_message}
                      </div>
                    )}
                    <div className="muted" style={{ fontSize: 12 }}>
                      Candidature envoyée :{" "}
                      {new Date(a.submitted_at || Date.now()).toLocaleString(
                        "fr-FR"
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
