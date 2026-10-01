import type { AllocationRun, Client } from '../../data/types';
import { fmtKg } from '../../lib/format';
import { ReportDocument, tdDoc, tdDocLeft, thDoc } from './ReportDocument';
import { REPORT_CATEGORIES, clientMonthData, lunaRaport } from './reportData';

/**
 * „Raport client – declarație AFM" pentru luna sesiunii. Clienții Alegreen își realizează obiectivele prin transfer
 * de responsabilitate, deci: introdus individual = 0, introdus prin transfer = total, colectat individual = 0,
 * colectat de organizație = cantitatea alocată în lună. Denumirile coloanelor urmează formularul AFM.
 */
export function RaportAFMReport({ run, client }: { run: AllocationRun; client: Client }) {
  const d = clientMonthData(run, client.id);
  return (
    <ReportDocument
      title="Raport client – declarație AFM"
      meta={[
        ['Client:', client.denumire],
        ['CUI:', client.cui],
        ['Reg. com.:', client.regCom ?? '—'],
        ['Nr. înregistrare producător:', client.nrProducator ?? '—'],
        ['Luna raportare:', lunaRaport(run)],
      ]}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${thDoc} w-[26%]`}>Categorie EEE</th>
            <th className={thDoc}>Cantitate totală de EEE introdusă pe piața națională (kg)</th>
            <th className={thDoc}>Cantitate introdusă pentru care se realizează obiectivele în mod individual (kg)</th>
            <th className={thDoc}>Cantitate introdusă pentru care se realizează obiectivele prin transfer către OTR (kg)</th>
            <th className={thDoc}>Cantitate de DEEE colectată în mod individual (kg)</th>
            <th className={thDoc}>Cantitate de DEEE colectată de către OTR (kg)</th>
          </tr>
        </thead>
        <tbody>
          {REPORT_CATEGORIES.map((c) => {
            const pus = d.puseLuna(c.cod);
            return (
              <tr key={c.cod}>
                <td className={tdDocLeft}>
                  {c.cod} - {c.denumire}
                </td>
                <td className={tdDoc}>{fmtKg(pus)}</td>
                <td className={tdDoc}>0,00</td>
                <td className={tdDoc}>{fmtKg(pus)}</td>
                <td className={tdDoc}>0,00</td>
                <td className={tdDoc}>{fmtKg(d.colectatLuna(c.cod))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ReportDocument>
  );
}
