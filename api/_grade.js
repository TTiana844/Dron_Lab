// api/_grade.js — jedna známka za lekciu z troch úrovní (Základ, Výzva, Expert).
// Základ splnený (3 z 3 prípadov) = známka 3. Vyššie úrovne ju vylepšujú.
// Všetky čísla sú v jednom bloku nižšie, aby sa dali ľahko upraviť.
//
// Body za lekciu (spolu 100), rozdelené rovnomerne medzi 3 prípady (A, B, C):
//   Základ 60 b.  ->  60 = známka 3
//   Výzva  18 b.  ->  78 = známka 2  (Výzva sa počíta, až keď je Základ splnený celý)
//   Expert 22 b.  -> 100 = známka 1  (Expert sa počíta, až keď je Výzva splnená celá)
// Pásma rovnaké ako v ostatných projektoch: 86–100 = 1, 70–85 = 2, 56–69 = 3, 40–55 = 4, 0–39 = 5.

export const POINTS = [60, 18, 22];
export const gradeOf = p => (p >= 86 ? 1 : p >= 70 ? 2 : p >= 56 ? 3 : p >= 40 ? 4 : 5);

// solved[úroveň] = pole 3 pravdivostných hodnôt pre prípady A, B, C (aspoň jeden pokus prešiel)
export function lessonScore(solved, attempted = true) {
  const n = lv => (solved[lv] || []).filter(Boolean).length;
  let pts = (POINTS[0] * n(0)) / 3;
  if (n(0) === 3) {
    pts += (POINTS[1] * n(1)) / 3;
    if (n(1) === 3) pts += (POINTS[2] * n(2)) / 3;
  }
  pts = Math.round(pts * 10) / 10;
  return { points: pts, grade: attempted ? gradeOf(pts) : null };
}
