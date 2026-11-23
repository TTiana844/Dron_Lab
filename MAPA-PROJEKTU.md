# Mapa projektu Dron Lab: čo kam nahrať na GitHub

Repozitár: `Dron_Lab` (nový, prázdny). Všetko ostatné sa nastaví vo Verceli.

## 1. Strom repozitára (presne takto)

```
Dron_Lab/                      ← koreň repozitára
├── index.html                 POVINNÉ   stránka pre žiakov aj učiteľa (hotová, negeneruje sa ručne)
├── package.json               POVINNÉ   obsahuje {"type":"module"}, bez neho API nebude fungovať
├── api/                       POVINNÉ   priečinok so serverovými funkciami
│   ├── _db.js                 POVINNÉ   databáza (Upstash), triedy a kódy
│   ├── _dron.js               POVINNÉ   výpočet simulátorov a semaforu
│   ├── _grade.js              POVINNÉ   známka za lekciu (body 60/18/22)
│   ├── config.js              POVINNÉ   načítanie triedy podľa kódu
│   ├── evaluate.js            POVINNÉ   odovzdanie, semafor, komentár trénera
│   ├── mine.js                POVINNÉ   „Moje odovzdania“ pre žiaka
│   └── teacher.js             POVINNÉ   učiteľ: tabuľka, triedy, ručná známka
├── src/
│   └── index.template.html    ODPORÚČANÉ   zdroj stránky (potrebný, ak budeš index.html znovu skladať)
├── build.mjs                  ODPORÚČANÉ   zloží index.html zo src/ a api/_dron.js
├── README.md                  ODPORÚČANÉ   stručný popis projektu
├── MAPA-PROJEKTU.md           VOLITEĽNÉ    tento súbor
└── test/                      VOLITEĽNÉ    automatické testy (na Vercel nemajú vplyv)
    ├── test.mjs
    ├── handler.test.mjs
    ├── teacher.test.mjs
    └── mine.test.mjs
```

**Minimum, aby to fungovalo:** `index.html`, `package.json` a 7 súborov v `api/`. Zvyšok je pre tvoje pohodlie.

## 2. Čo NEnahrávať
- súbor `.env`, kľúče a heslá (tie patria len do Vercel → Settings → Environment Variables),
- priečinok `node_modules/`,
- nič z dočasných súborov na tvojom počítači.

## 3. Postup nahratia
1. GitHub → **New repository** → názov `Dron_Lab` → Create (nepridávaj README ani .gitignore, súbory prinesieš sám/sama).
2. Rozbaľ `Dron_Lab.zip`. Na stránke repozitára klikni **uploading an existing file** (alebo Add file → Upload files).
3. Pretiahni do okna **obsah priečinka** (súbory `index.html`, `package.json`, `README.md`, `build.mjs`, `MAPA-PROJEKTU.md` a priečinky `api`, `src`, `test`). Priečinky sa nahrajú aj s podpriečinkami. Skontroluj, že `api/` je v koreni a nie v nejakom ďalšom priečinku.
4. Dole **Commit changes**.
5. Vercel → **Add New → Project** → vyber `Dron_Lab` → Framework preset **Other**, Build Command a Output Directory nechaj prázdne → Deploy.
6. Vercel → Settings → Environment Variables (pozri nižšie) → po pridaní **Redeploy**.
7. Otvor `tvoja-adresa.vercel.app/#ucitel`, prihlás sa a vytvor triedu.

## 4. Premenné prostredia (Vercel → Settings → Environment Variables)
| Premenná | Povinná | Poznámka |
|---|---|---|
| `ANTHROPIC_API_KEY` | áno | kľúč pre komentár trénera (ak chýba, odovzdania sa ukladajú, len bez komentára) |
| `TEACHER_PASSWORD` | áno | heslo do učiteľského pohľadu |
| `KV_REST_API_URL` a `KV_REST_API_TOKEN` | áno | Upstash Redis. Môžu mať aj názvy `UPSTASH_REDIS_REST_URL` a `UPSTASH_REDIS_REST_TOKEN`, alebo predponu (napr. `STORAGE_`). Použi **tú istú databázu** ako pri ostatných projektoch |
| `EVAL_MODEL` | nie | model pre komentáre (predvolene Haiku 4.5) |
| `ANTHROPIC_WORKSPACE_ID` | nie | len ak ho pri ostatných projektoch používaš |

## 5. Dôležité: databázu zdieľaš s ostatnými projektmi
- **Triedy a kódy sú spoločné.** Žiaci v Dron Lab použijú ten istý kód triedy ako v Insta360, Launchpad atď. Odovzdania sú oddelené (kľúče `subs:dron:…`).
- **Zmazanie triedy zmaže jej odovzdania a známky vo všetkých projektoch**, ktoré tú databázu používajú. Tlačidlo Zmazať triedu v Dron Lab na to pri potvrdení upozorní.
- Pred ostrým použitím vyskúšaj všetko na jednej skúšobnej triede.

## 6. Ako meniť projekt neskôr
| Chceš zmeniť | Uprav | Potom |
|---|---|---|
| vzhľad alebo texty stránky | `src/index.template.html` | `node build.mjs`, nahraj nový `index.html` |
| limity, prípady, výpočet simulátorov | `api/_dron.js` | `node build.mjs`, nahraj `index.html` **aj** `api/_dron.js` |
| body a pásma známok | `api/_grade.js` | nahraj `api/_grade.js` |
| tón a dĺžku komentárov trénera | `api/evaluate.js` (funkcia `buildPrompt`) | nahraj `api/evaluate.js` |

`node build.mjs` potrebuje Node.js (verzia 18 alebo novšia) na tvojom počítači. Ak ho nemáš, pošli mi zmenu a ja ti dám hotový `index.html`.

**Pravidlo:** `index.html` je generovaný súbor. Nemeň ho ručne, zmeny sa pri ďalšom zostavení stratia.

## 7. Čo je mimo tohto repozitára
- Úvodná lekcia 1.1 (simulátor bez hodnotenia) je samostatná stránka a nie je súčasťou tohto repozitára.
- Úpravy `index.html` v ostatných projektoch (Insta360, Launchpad, OBS, MIDI Keys, Mixpult) sa nahrávajú do ich vlastných repozitárov.
