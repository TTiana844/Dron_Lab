process.env.KV_REST_API_URL = "https://fake.upstash"; process.env.KV_REST_API_TOKEN = "t";
const S = { sets: { classes: new Set(["cls1"]) }, kv: {}, h: {} };
S.kv["class:cls1"] = JSON.stringify({ id: "cls1", name: "4.A", code: "ABC234", students: [{ id: "s01", name: "Anna" }, { id: "s02", name: "Boris" }, { id: "s03", name: "Cyril" }] });
const A = (ts, pass, by, byName) => ({ ts, date: "22. 11. 2026", time: "10:0" + ts, pass, by, byName, rows: [{ k: "odstup", ok: pass }], comment: "komentár " + ts });
S.h["subs:dron:cls1"] = {
  "1.2|0A|s01+s02": JSON.stringify({ lesson: "1.2", level: 0, caseId: "A", members: ["s01", "s02"], solved: true, attempts: [A(1, false, "s01", "Anna"), A(2, true, "s02", "Boris")] }),
  "1.2|0B|s03": JSON.stringify({ lesson: "1.2", level: 0, caseId: "B", members: ["s03"], solved: false, attempts: [A(3, false, "s03", "Cyril")] })
};
globalThis.fetch = async (url, opt) => { const [c, ...a] = JSON.parse(opt.body); let result = null;
  if (c === "SMEMBERS") result = [...(S.sets[a[0]] || [])]; else if (c === "GET") result = S.kv[a[0]] ?? null; else if (c === "HGETALL") result = Object.entries(S.h[a[0]] || {}).flat();
  return { ok: true, status: 200, json: async () => ({ result }) }; };
const { default: handler } = await import("../api/mine.js");
const call = async query => { let out; await handler({ query }, { setHeader() {}, status(c) { this.c = c; return this; }, json(o) { out = { status: this.c, ...o }; } }); return out; };
let bad = 0; const t = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) bad++; console.log((ok ? "OK  " : "CHYBA ") + n + (ok ? "" : ` -> ${JSON.stringify(g)} (čakané ${JSON.stringify(w)})`)); };
let r = await call({ code: "ABC234", studentId: "s02" });
t("člen tímu vidí tímové odovzdanie", r.lessons["1.2"].attempts.length, 2);
t("vidí, kto odovzdával, a komentár ku každému pokusu", r.lessons["1.2"].attempts.map(a => [a.by, !!a.comment]), [["Boris", true], ["Anna", true]]);
t("vidí mená členov tímu", r.lessons["1.2"].attempts[0].members, ["Anna", "Boris"]);
t("bunky Základ A splnená", r.lessons["1.2"].cells[0], ["ok", null, null]);
t("cudzie odovzdanie nevidí", r.lessons["1.2"].attempts.some(a => a.by === "Cyril"), false);
t("neposiela známky ani body", JSON.stringify(r).includes("grade") || JSON.stringify(r).includes("points"), false);
t("zlý kód", (await call({ code: "ZZZZZZ", studentId: "s02" })).reason, "bad_code");
t("neznámy žiak", (await call({ code: "ABC234", studentId: "s99" })).reason, "bad_student");
console.log(bad ? "\nZLYHALO: " + bad : "\nVšetky testy prešli."); process.exit(bad ? 1 : 0);
