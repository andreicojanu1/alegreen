export interface YearMonth {
  an: number;
  luna: number; // 1-12
}

export const monthKey = (m: YearMonth) => `${m.an}-${String(m.luna).padStart(2, '0')}`;

/** Lunile din intervalul [de la, până la], inclusiv, în ordine cronologică. */
export function monthRange(from: YearMonth, to: YearMonth): YearMonth[] {
  const out: YearMonth[] = [];
  let { an, luna } = from;
  while (an < to.an || (an === to.an && luna <= to.luna)) {
    out.push({ an, luna });
    luna += 1;
    if (luna > 12) {
      luna = 1;
      an += 1;
    }
  }
  return out;
}
