// Test učiteľského API: tabuľka, jedna známka za lekciu, tím, ručný prepis, všetky triedy.
process.env.KV_REST_API_URL = "https://fake.upstash"; process.env.KV_REST_API_TOKEN = "t"; process.env.TEACHER_PASSWORD = "heslo123";
const S = { sets: { classes: new Set(["cls1", "cls2"]) }, kv: {}, h: {} };
S.kv["class:cls1"] = JSON.stringify({ id: "cls1", name: "4.A", code: "ABC234", createdAt: 2, students: [{ id: "s01", name: "Anna" }, { id: "s02", name: "Boris" }, { id: "s03", name: "Cyril" }, { id: "s04", name: "" }] });
S.kv["class:cls2"] = JSON.stringify({ id: "cls2", name: "4.B", code: "XYZ789", createdAt: 1, students: [{ id: "s01", name: "Dana" }] });
const rec = (lesson, level, caseId, members, solved, attempts = 1) => ({ lesson, level, caseId, members, solved, attempts: Array.from({ length: attempts }, (_, i) => ({ ts: 1000 + i, pass: solved && i === attempts - 1, comment: "k" })) });
const put = (cls, r) => { (S.h["subs:dron:" + cls] ||= {})[`${r.lesson}|${r.level}${r.caseId}|${r.members.join("+")}`] = JSON.stringify(r); };
// Anna: lekcia 1.2 celý Základ (3 z 3) -> 60 b. -> známka 3
for (const c of ["A", "B", "C"]) put("cls1", rec("1.2", 0, c, ["s01"], true, 2));
// Anna + Boris tím: lekcia 2.1 celý Základ aj celá Výzva a 2 expertné -> 60+18+14,7 = 92,7 -> 1
for (const c of ["A", "B", "C"]) { put("cls1", rec("2.1", 0, c, ["s01", "s02"], true)); put("cls1", rec("2.1", 1, c, ["s01", "s02"], true)); }
for (const c of ["A", "B"]) put("cls1", rec("2.1", 2, c, ["s01", "s02"], true));
// Cyril: pokúsil sa v 2.2, nič nesplnil -> 0 b. -> 5
put("cls1", rec("2.2", 0, "A", ["s03"], false, 3));
// Dana (trieda 4.B): 2 z 3 základ -> 40 b. -> 4
put("cls2", rec("1.2", 0, "A", ["s01"], true)); put("cls2", rec("1.2", 0, "B", ["s01"], true));
S.h["ovr:dron:cls1"] = { "s01|1.2": JSON.stringify({ grade: 2, note: "ručne" }) };
globalThis.fetch = async (url, opt) => {
  const [c, ...a] = JSON.parse(opt.body); let result = null;
  if (c === "SMEMBERS") result = [...(S.sets[a[0]] || [])];
  else if (c === "SADD") (S.sets[a[0]] ||= new Set()).add(a[1]);
  else if (c === "GET") result = S.kv[a[0]] ?? null;
  else if (c === "HGETALL") result = Object.entries(S.h[a[0]] || {}).flat();
  else if (c === "HSET") (S.h[a[0]] ||= {})[a[1]] = a[2];
  else if (c === "HDEL") delete (S.h[a[0]] || {})[a[1]];
  return { ok: true, status: 200, json: async () => ({ result }) };
};
const { default: handler } = await import("../api/teacher.js");
const call = async body => { let out; await handler({ method: "POST", body: { password: "heslo123", ...body } }, { setHeader() {}, status(c) { this.c = c; return this; }, json(o) { out = { status: this.c, ...o }; } }); return out; };
let bad = 0; const t = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); if (!ok) bad++; console.log((ok ? "OK  " : "CHYBA ") + n + (ok ? "" : ` -> ${JSON.stringify(g)} (čakané ${JSON.stringify(w)})`)); };
let r = await call({ action: "overview", classId: "cls1" });
const row = id => r.table.find(x => x.id === id);
t("stĺpce meno a trieda osobitne", [row("s01").name, row("s01").className], ["Anna", "4.A"]);
t("neobsadené miesto sa nezobrazí", r.table.length, 3);
t("Anna 1.2: ručná známka 2 prebije vypočítanú 3", [row("s01").lessons["1.2"].calc, row("s01").lessons["1.2"].grade, row("s01").lessons["1.2"].points], [3, 2, 60]);
t("Anna 2.1 (tím): 92,7 b. -> 1", [row("s01").lessons["2.1"].points, row("s01").lessons["2.1"].grade, row("s01").lessons["2.1"].team], [92.7, 1, true]);
t("Boris dostane tímové odovzdanie tiež", [row("s02").lessons["2.1"].points, row("s02").lessons["2.1"].grade], [92.7, 1]);
t("Boris 1.2 bez pokusov: bez známky", [row("s02").lessons["1.2"].grade, row("s02").lessons["1.2"].attempts], [null, 0]);
t("Cyril 2.2: pokusy bez úspechu -> 5", [row("s03").lessons["2.2"].grade, row("s03").lessons["2.2"].attempts], [5, 3]);
t("bunky: 2.1 expert C nesplnený a nepokúšal sa", row("s01").lessons["2.1"].cells[2], ["ok", "ok", null]);
t("bunky: neúspešný pokus je 'try'", row("s03").lessons["2.2"].cells[0], ["try", null, null]);
t("priemer Anna = (2 + 1) / 2", row("s01").avg, 1.5);
t("bez parametra all nie je tableAll", r.tableAll, null);
r = await call({ action: "overview", classId: "cls1", all: true });
t("všetky triedy: 4 žiaci s názvom triedy", r.tableAll.map(x => x.name + "/" + x.className), ["Anna/4.A", "Boris/4.A", "Cyril/4.A", "Dana/4.B"]);
t("Dana 2 z 3 základ -> 4", r.tableAll[3].lessons["1.2"].grade, 4);
t("ručný prepis: uloženie", (await call({ action: "override", classId: "cls1", studentId: "s02", lessonId: "1.2", grade: 3, note: "x" })).ok, true);
r = await call({ action: "overview", classId: "cls1" }); t("prepis sa v tabuľke prejaví", r.table.find(x => x.id === "s02").lessons["1.2"].grade, 3);
t("zrušenie prepisu", (await call({ action: "override", classId: "cls1", studentId: "s02", lessonId: "1.2", grade: null })).ok, true);
t("neznáma lekcia", (await call({ action: "override", classId: "cls1", studentId: "s02", lessonId: "9.9", grade: 3 })).status, 400);
t("známka 6 sa odmietne", (await call({ action: "override", classId: "cls1", studentId: "s02", lessonId: "1.2", grade: 6 })).status, 400);
t("zlé heslo", (await call({ action: "overview", password: "zle" })).status, 401);
console.log(bad ? "\nZLYHALO: " + bad : "\nVšetky testy prešli."); process.exit(bad ? 1 : 0);
