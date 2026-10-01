import Decimal from 'decimal.js';

/**
 * Brief §7: după rotunjirea la 2 zecimale a alocărilor pe clienți, diferența reziduală față de totalul
 * (rotunjit) al categoriei se adaugă clientului cu cea mai mare cotă din categorie.
 * (D-05 rămâne deschisă în brief; regula „cota cea mai mare" este cea cerută explicit pentru prototip.)
 *
 * @param target  totalul exact al categoriei (sau o țintă deja rotunjită, cu roundTarget = false)
 * @param parts   valorile exacte ale clienților + cota fiecăruia
 * @returns valorile rotunjite la 2 zecimale, în aceeași ordine, cu suma = round(target, 2)
 */
export function reconcileRounded(
  target: Decimal,
  parts: { value: Decimal; cota: Decimal }[],
  roundTarget = true,
): Decimal[] {
  const rounded = parts.map((p) => p.value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
  if (parts.length === 0) return rounded;
  const targetRounded = roundTarget ? target.toDecimalPlaces(2, Decimal.ROUND_HALF_UP) : target;
  const sum = rounded.reduce((a, b) => a.plus(b), new Decimal(0));
  const residual = targetRounded.minus(sum);
  if (!residual.isZero()) {
    let idx = 0;
    parts.forEach((p, i) => {
      if (p.cota.greaterThan(parts[idx].cota)) idx = i;
    });
    rounded[idx] = rounded[idx].plus(residual);
  }
  return rounded;
}
