import type { ReactNode } from 'react';
import { Logo } from '../layout/Logo';

/** Foaia unui raport lunar (format A4 pe ecran), cu antet Alegreen. */
export function ReportDocument({ title, meta, children, footnote }: { title: string; meta: [string, ReactNode][]; children: ReactNode; footnote?: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-[860px] rounded-sm bg-white px-10 py-9 text-[12.5px] text-gray-900 shadow-[0_1px_3px_rgba(16,24,40,0.12)] print:shadow-none">
      <header className="flex items-start justify-between gap-6">
        <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5">
          {meta.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-gray-600 italic">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col items-end">
          <Logo onLight />
          <span className="mt-1 text-[10px] tracking-wide text-gray-500 uppercase">ALE GREEN UMB SRL · OIREP DEEE</span>
        </div>
      </header>
      <h1 className="mt-8 mb-6 text-center text-lg font-bold">{title}</h1>
      <div className="overflow-x-auto">{children}</div>
      {footnote && <p className="mt-4 text-[11px] text-gray-600">{footnote}</p>}
    </article>
  );
}

export const thDoc = 'border border-gray-300 bg-gray-50 px-2 py-2 text-center align-middle font-semibold';
export const tdDoc = 'border border-gray-300 px-2 py-1.5 text-center tabular';
export const tdDocLeft = 'border border-gray-300 px-2 py-1.5 text-left';
