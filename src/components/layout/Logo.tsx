/** Aproximare a logo-ului Alegreen (frunze verzi + scris de mână). De înlocuit cu fișierul oficial al logo-ului. */
export function Logo({ compact = false, onLight = false }: { compact?: boolean; onLight?: boolean }) {
  return (
    <div className="relative inline-flex flex-col items-center leading-none select-none" aria-label="Alegreen">
      <svg width="34" height="20" viewBox="0 0 34 20" className="mb-[-6px] ml-6" aria-hidden>
        <path d="M17 19C12 15 9 9 14 1c5 6 6 12 3 18z" fill="#8bd35c" />
        <path d="M18 19c1-6 5-11 14-12-2 7-7 11-14 12z" fill="#4caf50" />
        <path d="M16 19C11 17 6 14 3 8c6 0 11 4 13 11z" fill="#6cc04a" />
      </svg>
      {!compact && <span className={`font-logo text-[22px] font-bold ${onLight ? 'text-green-800' : 'text-white'}`}>Alegreen</span>}
    </div>
  );
}
