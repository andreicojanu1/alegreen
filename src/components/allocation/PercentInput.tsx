import { useEffect, useState } from 'react';
import Decimal from 'decimal.js';
import { parseRoDecimal } from '../../lib/format';
import { ratioToPctText } from '../../lib/runLabels';

/** Câmp procentual: afișează „30" / „21,67", emite raportul („0.3" / „0.2167"). Valid doar între 0 și 100. */
export function PercentInput({
  value,
  onChange,
  disabled,
  className = '',
  ariaLabel,
}: {
  value: string;
  onChange: (ratio: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(() => ratioToPctText(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(ratioToPctText(value));
  }, [value, focused]);

  const parsed = parseRoDecimal(text);
  const invalid = parsed === null || new Decimal(parsed).lessThan(0) || new Decimal(parsed).greaterThan(100);

  return (
    <input
      aria-label={ariaLabel}
      inputMode="decimal"
      disabled={disabled}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        if (invalid) setText(ratioToPctText(value));
      }}
      onChange={(e) => {
        setText(e.target.value);
        const p = parseRoDecimal(e.target.value);
        if (p !== null && !new Decimal(p).lessThan(0) && !new Decimal(p).greaterThan(100)) {
          onChange(new Decimal(p).div(100).toString());
        }
      }}
      className={`h-8 rounded-md border bg-white px-3 text-right text-sm tabular focus:ring-2 focus:ring-gray-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 ${
        invalid && !disabled ? 'border-red-400' : 'border-gray-300'
      } ${className}`}
    />
  );
}
