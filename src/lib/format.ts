import Decimal from 'decimal.js';

/** Formatare numerică românească: 1.234,56. Rotunjirea se face DOAR aici (la afișare), half-up. */
export function fmtNum(value: Decimal.Value, dp = 2): string {
  const d = new Decimal(value);
  let s = d.toFixed(dp, Decimal.ROUND_HALF_UP);
  let neg = false;
  if (s.startsWith('-')) {
    neg = true;
    s = s.slice(1);
  }
  const [int, frac] = s.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const out = frac !== undefined ? `${grouped},${frac}` : grouped;
  const isZero = /^[0.,]+$/.test(out);
  return neg && !isZero ? `-${out}` : out;
}

export const fmtKg = (value: Decimal.Value) => fmtNum(value, 2);

/** Procent dintr-un raport (0,8888 -> "88,88%"). */
export function fmtPct(ratio: Decimal.Value, dp = 2): string {
  return `${fmtNum(new Decimal(ratio).times(100), dp)}%`;
}

/** Valoare numerică introdusă în format românesc ("21,67" sau "1.234,5") -> string zecimal canonic, sau null. */
export function parseRoDecimal(input: string): string | null {
  const t = input.trim().replace(/\s/g, '');
  if (!t) return null;
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^-?\d*(\.\d*)?$/.test(normalized) || normalized === '.' || normalized === '-') return null;
  try {
    return new Decimal(normalized).toString();
  } catch {
    return null;
  }
}

export const LUNI = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];
export const LUNI_SCURT = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
const LUNI_DATA = ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'];

const pad = (n: number) => String(n).padStart(2, '0');

/** 29.09.2026, 10:47 */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 1 oct. 2026, 14:49 */
export function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${LUNI_DATA[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 01.10.2026 */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
