// /api/mine.js — „Moje odovzdania“ pre žiaka (bez hesla učiteľa, chránené kódom triedy).
// Žiak pošle kód triedy a svoje id. Dostane len záznamy, v ktorých je členom (aj tímové),
// vrátane AI komentára ku každému pokusu a mena toho, kto pokus odovzdal. Známky ani body nevracia —
// tie ukazuje len učiteľský pohľad.

import { dbConfigured, findClassByCode, hgetall, subsKey } from "./_db.js";

const LESSON_IDS = ["1.2", "2.1", "2.2"];
const CASE_IDS = ["A", "B", "C"];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!dbConfigured()) { res.status(200).json({ ok: false, reason: "no_db" }); return; }
  try {
    const q = req.query || {};
    const cls = await findClassByCode(q.code);
    if (!cls) { await sleep(500); res.status(200).json({ ok: false, reason: "bad_code" }); return; }
    const byId = Object.fromEntries(cls.students.filter(s => s.name).map(s => [s.id, s.name]));
    const sid = String(q.studentId || "");
    if (!byId[sid]) { res.status(200).json({ ok: false, reason: "bad_student" }); return; }

    const subs = Object.values(await hgetall(subsKey(cls.id))).map(v => { try { return JSON.parse(v); } catch { return null; } })
      .filter(r => r && Array.isArray(r.members) && r.members.includes(sid));
    const lessons = {};
    for (const L of LESSON_IDS) {
      const recs = subs.filter(r => r.lesson === L);
      const cells = [0, 1, 2].map(lv => CASE_IDS.map(c => {
        const rs = recs.filter(r => r.level === lv && r.caseId === c);
        return !rs.length ? null : rs.some(r => r.solved) ? "ok" : "try";
      }));
      const attempts = recs.flatMap(r => (r.attempts || []).map(a => ({
        level: r.level, caseId: r.caseId,
        members: r.members.map(id => byId[id] || "?"),
        by: a.byName || null, date: a.date, time: a.time, ts: a.ts,
        pass: !!a.pass, rows: a.rows || [], comment: a.comment || null, note: a.note || null
      }))).sort((a, b) => b.ts - a.ts).slice(0, 50);
      lessons[L] = { cells, attempts };
    }
    res.status(200).json({ ok: true, student: { id: sid, name: byId[sid] }, lessons });
  } catch (e) {
    res.status(500).json({ ok: false, reason: "db_error", error: String(e.message || e) });
  }
}
