import Decimal from 'decimal.js';
import type { AllocationRun, Client } from '../../data/types';
import { fmtDateTime, fmtKg } from '../../lib/format';
import { ReportDocument, tdDoc, tdDocLeft, thDoc } from './ReportDocument';
import { REPORT_CATEGORIES, clientMonthData, lunaRaport } from './reportData';

/** „Situație EEE" lunară a clientului: pus pe piață și colectat alocat, pe lună și cumulat de la începutul anului. */
export function SituatieEEEReport({ run, client }: { run: AllocationRun; client: Client }) {
  const d = clientMonthData(run, client.id);
  const L = lunaRaport(run);
  const rows = REPORT_CATEGORIES.map((c) => ({ ...c, a: d.puseLuna(c.cod), b: d.colectatLuna(c.cod), c: d.puseCumul(c.cod), e: d.colectatCumul(c.cod) }));
  const tot = (k: 'a' | 'b' | 'c' | 'e') => rows.reduce((s, r) => s.plus(r[k]), new Decimal(0));
  const declared = [...new Set(d.decl.map((l) => l.categorie))];
  return (
    <ReportDocument
      title="Situație EEE"
      meta={[
        ['Client:', client.denumire],
        ['Adresa:', client.adresa ?? '—'],
        ['CUI:', client.cui],
        ['Reg. com.:', client.regCom ?? '—'],
        ['Nr. / luna:', `${run.codSesiune} / ${L}`],
        ['Data generării:', run.finalizatLa ? fmtDateTime(run.finalizatLa) : '—'],
        ['Categorii declarate:', declared.length ? REPORT_CATEGORIES.filter((c) => declared.includes(c.cod)).map((c) => c.cod).join('; ') : '—'],
      ]}
      footnote={
        <>
          * Cantitatea colectată de DEEE alocată clientului de ALE GREEN UMB SRL în sesiunea lunară aprobată. Defalcarea pe luni a
          cantităților provenite din realocare între categorii este o repartizare proporțională, nu o trasabilitate fizică a
          transporturilor.
        </>
      }
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${thDoc} w-[34%]`}>Categorie EEE</th>
            <th className={thDoc}>Cantități de EEE puse pe piață în luna {L} (kg)</th>
            <th className={thDoc}>Cantitate colectată de DEEE aferentă lunii {L}* (kg)</th>
            <th className={thDoc}>Cantitate de EEE pusă pe piață aferentă ianuarie – {L} (kg)</th>
            <th className={thDoc}>Cantitate colectată de DEEE aferentă ianuarie – {L} (kg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cod}>
              <td className={tdDocLeft}>
                {r.cod} - {r.denumire}
              </td>
              <td className={tdDoc}>{fmtKg(r.a)}</td>
              <td className={tdDoc}>{fmtKg(r.b)}</td>
              <td className={tdDoc}>{fmtKg(r.c)}</td>
              <td className={tdDoc}>{fmtKg(r.e)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className={tdDocLeft}>TOTAL</td>
            <td className={tdDoc}>{fmtKg(tot('a'))}</td>
            <td className={tdDoc}>{fmtKg(tot('b'))}</td>
            <td className={tdDoc}>{fmtKg(tot('c'))}</td>
            <td className={tdDoc}>{fmtKg(tot('e'))}</td>
          </tr>
        </tbody>
      </table>
    </ReportDocument>
  );
}
