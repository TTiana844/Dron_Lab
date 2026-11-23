// Zloží index.html zo src/index.template.html a z api/_dron.js (rovnaký výpočet ako na serveri).
// Spusti po každej zmene _dron.js:  node build.mjs
import { readFileSync, writeFileSync } from "node:fs";
const dron = readFileSync("api/_dron.js", "utf8").replace(/^export /gm, "");
const tpl = readFileSync("src/index.template.html", "utf8");
if (!tpl.includes("/*__DRON__*/")) throw new Error("V šablóne chýba /*__DRON__*/");
writeFileSync("index.html", tpl.replace("/*__DRON__*/", () => dron));
console.log("index.html hotový (" + Math.round(tpl.length / 1024) + " kB šablóna + _dron.js)");
