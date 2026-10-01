import Decimal from 'decimal.js';
import type { AllocationRun, Client } from '../../data/types';
import { fmtKg, fmtNum } from '../../lib/format';
import { ReportDocument, tdDoc, tdDocLeft, thDoc } from './ReportDocument';
import { REPORT_CATEGORIES, clientMonthData, lunaRaport, sumKg } from './reportData';

/** „Raportare EEE puse pe piață" — declarația lunară a clientului (foaia Raport EEE), pentru luna sesiunii. */
export function RaportareEEEReport({ run, client }: { run: AllocationRun; client: Client }) {
  const d = clientMonthData(run, client.id);
  const linii = [...d.liniiLuna].sort((a, b) => a.subcategorieCod.localeCompare(b.subcategorieCod, 'ro', { numeric: true }));
  const buc = linii.reduce((a, l) => a + l.bucati, 0);
  const valoare = linii.reduce((a, l) => a.plus(l.valoareRon), new Decimal(0));
  return (
    <ReportDocument
      title="Raportare EEE puse pe piață"
      meta={[
        ['Client:', client.denumire],
        ['Adresa:', client.adresa ?? '—'],
        ['CUI:', client.cui],
        ['Reg. com.:', client.regCom ?? '—'],
        ['Nr. / luna:', lunaRaport(run)],
        ['Nr. bucăți:', fmtNum(buc, 0)],
        ['Greutate:', `${fmtKg(sumKg(linii))} kg`],
      ]}
    >
      <table className="mb-6 w-full max-w-md border-collapse">
        <thead>
          <tr>
            <th className={thDoc}>Categorie</th>
            <th className={thDoc}>Cantitate (buc)</th>
            <th className={thDoc}>Greutate (kg)</th>
          </tr>
        </thead>
        <tbody>
          {REPORT_CATEGORIES.map((c) => {
            const l = linii.filter((x) => x.categorie === c.cod);
            return (
              <tr key={c.cod}>
                <td className={tdDoc}>{c.cod}</td>
                <td className={tdDoc}>{fmtNum(l.reduce((a, x) => a + x.bucati, 0), 0)}</td>
                <td className={tdDoc}>{fmtKg(sumKg(l))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={thDoc}>Categorie</th>
            <th className={thDoc}>Subcategorie</th>
            <th className={thDoc}>Denumire</th>
            <th className={thDoc}>Cantitate (buc)</th>
            <th className={thDoc}>Greutate (kg)</th>
            <th className={thDoc}>Valoare (lei fără TVA)</th>
          </tr>
        </thead>
        <tbody>
          {linii.length === 0 && (
            <tr>
              <td colSpan={6} className={tdDoc}>
                Nu există cantități declarate în luna {lunaRaport(run)}.
              </td>
            </tr>
          )}
          {linii.map((l) => (
            <tr key={l.id} className={new Decimal(l.greutateKg).isZero() && l.bucati > 0 ? 'bg-amber-50' : ''}>
              <td className={tdDoc}>{l.categorie}</td>
              <td className={tdDoc}>{l.subcategorieCod}</td>
              <td className={tdDocLeft}>{l.subcategorie}</td>
              <td className={tdDoc}>{fmtNum(l.bucati, 0)}</td>
              <td className={tdDoc}>{fmtKg(l.greutateKg)}</td>
              <td className={tdDoc}>{fmtKg(l.valoareRon)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className={tdDocLeft} colSpan={3}>
              TOTAL GENERAL
            </td>
            <td className={tdDoc}>{fmtNum(buc, 0)}</td>
            <td className={tdDoc}>{fmtKg(sumKg(linii))}</td>
            <td className={tdDoc}>{fmtKg(valoare)}</td>
          </tr>
        </tbody>
      </table>
    </ReportDocument>
  );
}
