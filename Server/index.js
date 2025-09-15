import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";

/* ========== App & Middlewares ========== */
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

/* ========== Supabase ========== */
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const BUCKET = process.env.SUPABASE_RESUMES_BUCKET || "resumes";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
const upload = multer({ storage: multer.memoryStorage() });

/* ========== Helpers ========== */
function slug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: false });
    console.log(`✅ Bucket "${BUCKET}" créé`);
  }
}
ensureBucket();

/* ========== Routes ========== */

// Test API
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Students
app.get("/api/students", async (_req, res) => {
  const { data, error } = await supabase
    .from("student")
    .select("*")
    .order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.delete("/api/students/:id", async (req, res) => {
  const { error } = await supabase
    .from("student")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// Trainings
app.get("/api/trainings", async (_req, res) => {
  const { data, error } = await supabase
    .from("training")
    .select("*")
    .order("id");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post("/api/trainings", async (req, res) => {
  const { data, error } = await supabase
    .from("training")
    .insert({ title: req.body.title })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put("/api/trainings/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("training")
    .update({ title: req.body.title })
    .eq("id", req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete("/api/trainings/:id", async (req, res) => {
  const { error } = await supabase
    .from("training")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// Sessions
app.get("/api/trainings/:id/sessions", async (req, res) => {
  const { data, error } = await supabase
    .from("session")
    .select("*")
    .eq("training_id", req.params.id)
    .order("start_date");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});
app.post("/api/sessions", async (req, res) => {
  const { data, error } = await supabase
    .from("session")
    .insert({
      training_id: req.body.training_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      capacity: req.body.capacity || 20,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete("/api/sessions/:id", async (req, res) => {
  const { error } = await supabase
    .from("session")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

/* ---------- PUBLIC: POST candidature ---------- */
app.post(
  "/api/public/apply",
  upload.fields([{ name: "resume" }, { name: "cover_letter" }]),
  async (req, res) => {
    try {
      const { full_name, email, phone, training_id, session_id, note } =
        req.body || {};
      if (!full_name || !email || !training_id || !session_id)
        return res.status(400).json({ error: "Champs requis manquants" });

      // upsert student
      const emailNorm = String(email).trim().toLowerCase();
      let { data: student } = await supabase
        .from("student")
        .select("*")
        .eq("email", emailNorm)
        .maybeSingle();
      if (!student) {
        const ins = await supabase
          .from("student")
          .insert({ full_name, email: emailNorm, phone: phone || null })
          .select()
          .single();
        if (ins.error)
          return res.status(500).json({ error: ins.error.message });
        student = ins.data;
      }

      // upload fichiers
      async function uploadFile(file) {
        if (!file) return null;
        const ext = file.originalname.split(".").pop();
        const key = `student-${student.id}/${Date.now()}-${slug(
          student.full_name
        )}.${ext}`;
        const up = await supabase.storage
          .from(BUCKET)
          .upload(key, file.buffer, {
            upsert: true,
            contentType: file.mimetype,
          });
        if (up.error) throw up.error;
        return key;
      }
      const resume_path = await uploadFile(req.files?.resume?.[0]);
      const cover_letter_path = await uploadFile(req.files?.cover_letter?.[0]);

      // create enrollment
      const ins = await supabase
        .from("enrollment")
        .insert({
          student_id: student.id,
          training_id: Number(training_id),
          session_id: Number(session_id),
          note: note || null,
          resume_path,
          cover_letter_path,
          status: "pending",
        })
        .select()
        .single();
      if (ins.error) return res.status(500).json({ error: ins.error.message });

      res.json({ ok: true, message: "✅ Candidature envoyée !" });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  }
);

/* ---------- PUBLIC: suivre candidature ---------- */
app.get("/api/public/status", async (req, res) => {
  const email = String(req.query.email || "")
    .trim()
    .toLowerCase();
  if (!email) return res.status(400).json({ error: "email requis" });

  const { data: stu } = await supabase
    .from("student")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!stu) return res.json([]);

  const { data, error } = await supabase
    .from("enrollment")
    .select(
      `
      id,status,decision_message,submitted_at,
      training:training_id(title),
      session:session_id(start_date,end_date)
    `
    )
    .eq("student_id", stu.id)
    .order("submitted_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

/* ---------- ADMIN: candidatures ---------- */
app.get("/api/admin/applications", async (_req, res) => {
  const { data, error } = await supabase
    .from("enrollment")
    .select(
      `
      id,status,note,resume_path,cover_letter_path,submitted_at,
      student:student_id(full_name,email,phone),
      training:training_id(title),
      session:session_id(start_date,end_date)
    `
    )
    .order("submitted_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const out = await Promise.all(
    (data || []).map(async (row) => {
      const r = { ...row };
      if (r.resume_path) {
        const s = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.resume_path, 3600);
        if (!s.error) r.resume_url = s.data.signedUrl;
      }
      if (r.cover_letter_path) {
        const s = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(r.cover_letter_path, 3600);
        if (!s.error) r.cover_letter_url = s.data.signedUrl;
      }
      return r;
    })
  );
  res.json(out);
});
app.patch("/api/admin/applications/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!["accepted", "refused"].includes(status))
    return res.status(400).json({ error: "status invalide" });

  const decision_message =
    status === "accepted"
      ? "Félicitations, vous êtes admissible 🎉"
      : "Votre candidature n'a pas été retenue.";

  const { data, error } = await supabase
    .from("enrollment")
    .update({ status, decision_message })
    .eq("id", id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* ---------- FRONT ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

/* ---------- START ---------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
