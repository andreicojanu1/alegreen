import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/** ID-ul unic al sesiunii de alocare, cu copiere rapidă (pentru referință în suport, audit și rapoarte). */
export function SessionCode({ code, size = 'md' }: { code: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copiază ID-ul sesiunii"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard?.writeText(code).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          },
          () => {},
        );
      }}
      className={`group inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 font-mono text-gray-700 hover:border-gray-300 hover:bg-white ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'
      }`}
    >
      {code}
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-gray-400 group-hover:text-gray-600" />}
    </button>
  );
}
