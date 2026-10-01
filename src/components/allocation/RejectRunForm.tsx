import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Button } from '../ui/Button';

/** Respingerea unei rulări de către aprobator: motiv obligatoriu; rularea revine la Revizuire. */
export function RejectRunForm({ onReject }: { onReject: (motiv: string) => void }) {
  const [open, setOpen] = useState(false);
  const [motiv, setMotiv] = useState('');
  const valid = motiv.trim().length >= 5;
  if (!open) {
    return (
      <Button variant="secondary" icon={<XCircle size={16} />} onClick={() => setOpen(true)}>
        Respinge
      </Button>
    );
  }
  return (
    <div className="mt-3 w-full rounded-xl border border-red-200 bg-red-50/60 p-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-gray-800">
          Motivul respingerii <span className="text-red-600">*</span>
        </span>
        <textarea
          autoFocus
          rows={2}
          value={motiv}
          onChange={(e) => setMotiv(e.target.value)}
          placeholder="ex. mutarea de la ECO SUN nu are acordul clientului; refaceți revizuirea."
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:ring-2 focus:ring-gray-200 focus:outline-none"
        />
      </label>
      <p className="mt-1 text-xs text-gray-600">Rularea revine în draft, la pasul „Revizuire și confirmare”, cu motivul vizibil pentru operator.</p>
      <div className="mt-3 flex gap-2">
        <Button icon={<XCircle size={16} />} disabled={!valid} onClick={() => onReject(motiv.trim())} className="bg-red-700 hover:bg-red-800">
          Confirmă respingerea
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          Renunță
        </Button>
      </div>
    </div>
  );
}
