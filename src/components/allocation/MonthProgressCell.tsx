import type Decimal from 'decimal.js';
import type { MonthState } from '../../lib/allocationTimeline';
import { fmtKg } from '../../lib/format';

/**
 * Celula „Alocat {lună}": cifra crește live în timpul animației. Luna fără colectat afișează „—".
 * Luna aflată în procesare e evidențiată discret (fundal albastru deschis).
 */
export function MonthProgressCell({ value, state, bold = false }: { value: Decimal | number; state: MonthState; bold?: boolean }) {
  const bg = state === 'active' ? 'bg-blue-50' : '';
  if (state === 'empty') {
    return <td className="px-3 py-2.5 text-right text-gray-400">—</td>;
  }
  return (
    <td className={`px-3 py-2.5 text-right tabular transition-colors ${bg} ${state === 'pending' ? 'text-gray-400' : ''} ${bold ? 'font-semibold' : ''}`}>
      {fmtKg(value)}
    </td>
  );
}
