# Dron Lab

Interaktívne cvičenia z dronových show (odbor 2567 multimédiá). Žiak v prehliadači upravuje show v simulátore, odovzdá ju a dostane semafor a krátky komentár trénera. Architektúra je rovnaká ako v Insta360_Lab (Vercel + Upstash).

## Súbory
| Súbor | Čo robí |
|---|---|
| `index.html` | žiacka aj učiteľská stránka — **negeneruje sa ručne**, pozri Zostavenie. Učiteľ sa prihlási na adrese `…/#ucitel` |
| `src/index.template.html` | zdroj stránky |
| `build.mjs` | zloží `index.html` zo šablóny a z `api/_dron.js` |
| `api/_dron.js` | výpočet simulátorov a semaforu (rovnaký kód beží na serveri aj v prehliadači) |
| `api/_grade.js` | jedna známka za lekciu: Základ 60 b. = 3, Výzva +18, Expert +22 |
| `api/evaluate.js` | odovzdanie: server prepočíta semafor z parametrov, doplní AI komentár, uloží každý pokus |
| `api/mine.js` | „Moje odovzdania“ pre žiaka (bez známok) |
| `api/teacher.js` | učiteľ: triedy, tabuľka lekcia × úroveň, ručná známka |
| `api/config.js`, `api/_db.js` | kód triedy a zoznam mien, Upstash (projekt `dron`) |
| `test/` | automatické testy |

## Zostavenie
Po každej zmene `api/_dron.js` alebo `src/index.template.html` spusti `node build.mjs` a nahraj nový `index.html`.

## Premenné vo Verceli
`ANTHROPIC_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `TEACHER_PASSWORD`; voliteľne `EVAL_MODEL` (predvolene Haiku 4.5) a `ANTHROPIC_WORKSPACE_ID`.

## Testy
`node test/test.mjs`, `node test/handler.test.mjs`, `node test/teacher.test.mjs`, `node test/mine.test.mjs`

`node test/test.mjs` a ostatné testy bežia bez pripojenia (napodobenina databázy a AI).
