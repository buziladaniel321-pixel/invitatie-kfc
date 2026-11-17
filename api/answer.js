// Funcție Vercel (rulează pe server, nu în browser):
//  - POST: primește în secret răspunsul lui Iaris și îl salvează;
//  - GET:  îți dă răspunsurile, dar doar dacă trimiți parola corectă.
// Răspunsurile stau într-o bază de date mică Upstash Redis, folosită prin REST (fără pachete npm).
const crypto = require("crypto");

const ALLOWED_TIMES = ["13:00", "13:30", "14:00"];
const MAX_SAVED = 50; // păstrăm doar ultimele 50, ca lista să nu crească la nesfârșit

// Trimite o comandă la Redis, de ex. ["LPUSH", "answers", "..."]
async function redis(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Baza de date nu e conectată la proiect");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error("Redis a răspuns cu " + response.status);
  return (await response.json()).result;
}

// Verifică parola. Comparăm amprentele (hash), ca timpul de verificare să nu dea indicii.
function isOwner(key) {
  const secret = (process.env.ADMIN_KEY || "").trim();
  if (!secret || typeof key !== "string") return false;
  const hash = (text) => crypto.createHash("sha256").update(text).digest();
  return crypto.timingSafeEqual(hash(key.trim()), hash(secret));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      // Primim doar valori cunoscute, ca nimeni să nu poată scrie orice în listă
      const step = body.step === "time" ? "time" : "yes";
      const time = ALLOWED_TIMES.includes(body.time) ? body.time : null;
      if (step === "time" && !time) return res.status(400).json({ ok: false });
      const noAttempts = Math.min(Math.max(parseInt(body.noAttempts, 10) || 0, 0), 999);

      const entry = { step, time, noAttempts, at: new Date().toISOString() };
      await redis(["LPUSH", "answers", JSON.stringify(entry)]);
      await redis(["LTRIM", "answers", "0", String(MAX_SAVED - 1)]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "GET") {
      if (!isOwner(req.headers["x-admin-key"])) return res.status(401).json({ ok: false });
      const saved = (await redis(["LRANGE", "answers", "0", String(MAX_SAVED - 1)])) || [];
      return res.status(200).json({ ok: true, answers: saved.map((item) => JSON.parse(item)) });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false });
  }
};
