// Test celého handlera s napodobeninou Upstash (pamäť) a Anthropic API.
process.env.KV_REST_API_URL = "https://fake.upstash"; process.env.KV_REST_API_TOKEN = "t"; process.env.ANTHROPIC_API_KEY = "k";
const store = { sets: {}, kv: {}, hashes: {} };
let aiMode = "ok", aiCalls = 0, lastPrompt = null;
globalThis.fetch = async (url, opt) => {
  const body = JSON.parse(opt.body);
  if (String(url).includes("anthropic")) {
    aiCalls++; lastPrompt = body;
    if (aiMode === "fail") return { ok: false, status: 500, json: async () => ({ error: { message: "boom" } }) };
    return { ok: true, status: 200, json: async () => ({ stop_reason: "tool_use", content: [{ type: "tool_use", input: { comment: "Dobrý pokus. Skús väčší kruh." } }] }) };
  }
  const [c, ...a] = body; let result = null;
  if (c === "SMEMBERS") result = [...(store.sets[a[0]] || [])];
  else if (c === "SADD") (store.sets[a[0]] ||= new Set()).add(a[1]);
  else if (c === "GET") result = store.kv[a[0]] ?? null;
  else if (c === "HGET") result = store.hashes[a[0]]?.[a[1]] ?? null;
  else if (c === "HSET") (store.hashes[a[0]] ||= {})[a[1]] = a[2];
  return { ok: true, status: 200, json: async () => ({ result }) };
};
store.sets.classes = new Set(["c1"]);
store.kv["class:c1"] = JSON.stringify({ id: "c1", name: "4.A", code: "ABC234", students: [{ id: "s01", name: "Anna" }, { id: "s02", name: "Boris" }, { id: "s03", name: "" }] });
const { default: handler } = await import("../api/evaluate.js");
const call = async meta => { let out; await handler({ method: "POST", body: { meta } }, { setHeader() {}, status(c) { this.c = c; return this; }, json(o) { out = { status: this.c, ...o }; } }); return out; };
let bad = 0; const t = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) bad++; console.log((ok ? "OK  " : "CHYBA ") + n + (ok ? "" : ` -> ${JSON.stringify(g)} (čakané ${JSON.stringify(w)})`)); };
const base = { code: "ABC234", classId: "c1", members: ["s01"], by: "s01", lesson: "1.2", caseId: "A", level: 0, params: { R: 55 } };
let r = await call(base); t("pokazená show: neprešla, uložená, AI komentár", [r.status, r.pass, r.saved, r.comment], [200, false, true, "Dobrý pokus. Skús väčší kruh."]);
t("prompt nehovorí o známke a obsahuje nastavenie", [lastPrompt.system[0].text.includes("Nehovor o známke"), lastPrompt.messages[0].content[0].text.includes("veľkosť tvaru: 55")], [true, true]);
r = await call(base); t("rýchle opakovanie je zastavené", r.status, 429);
const rec = () => JSON.parse(store.hashes["subs:dron:c1"]["1.2|0A|s01"]);
rec().attempts[0].ts -= 10000; { const x = rec(); x.attempts[0].ts -= 10000; store.hashes["subs:dron:c1"]["1.2|0A|s01"] = JSON.stringify(x); }
r = await call({ ...base, params: { R: 100 } }); t("oprava prešla, solved", [r.status, r.pass, r.solved], [200, true, true]);
t("v histórii sú oba pokusy s komentárom", rec().attempts.map(a => [a.pass, !!a.comment]), [[false, true], [true, true]]);
{ const x = rec(); x.attempts.forEach(a => a.ts -= 10000); store.hashes["subs:dron:c1"]["1.2|0A|s01"] = JSON.stringify(x); }
aiMode = "fail"; r = await call({ ...base, params: { R: 55 } });
t("AI zlyhala: semafor aj uloženie ostávajú, solved ostáva", [r.status, r.pass, r.saved, r.comment, r.solved, !!rec().attempts.at(-1).aiErr], [200, false, true, null, true, true]);
aiMode = "ok";
t("tím: uložený pod spoločným kľúčom", (await call({ ...base, members: ["s02", "s01"], by: "s02", params: { R: 100 } })).saved && !!store.hashes["subs:dron:c1"]["1.2|0A|s01+s02"], true);
{ const a = JSON.parse(store.hashes["subs:dron:c1"]["1.2|0A|s01+s02"]).attempts.at(-1); t("tím: zapísané, kto odovzdal", [a.by, a.byName], ["s02", "Boris"]); }
t("tím bez určeného odovzdávajúceho", (await call({ ...base, members: ["s01", "s02"], by: undefined })).status, 400);
t("odovzdávajúci nie je členom tímu", (await call({ ...base, members: ["s01"], by: "s02" })).status, 400);
t("samostatný žiak: odovzdávajúci sa doplní sám (nie je to chyba 400)", (await call({ ...base, by: undefined, params: { R: 100 } })).status !== 400, true);
t("zlý kód triedy", (await call({ ...base, code: "ZZZZZZ" })).status, 409);
t("člen mimo triedy", (await call({ ...base, members: ["s03"] })).status, 400);
t("neplatný parameter", (await call({ ...base, params: { R: 57 } })).status, 400);
t("neznáma lekcia", (await call({ ...base, lesson: "9.9" })).status, 400);
t("päť členov", (await call({ ...base, members: ["s01", "s02", "s03", "s04", "s05"] })).status, 400);
t("počet volaní AI (3 pokusy + 1 zopakované po chybe 500 + tím)", aiCalls, 5);
console.log(bad ? "\nZLYHALO: " + bad : "\nVšetky testy prešli."); process.exit(bad ? 1 : 0);
