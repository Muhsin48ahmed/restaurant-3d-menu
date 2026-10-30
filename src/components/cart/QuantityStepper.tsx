"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label: string;
};

const BUTTON_CLASS =
  "flex h-12 w-11 items-center justify-center text-lg text-ink-soft transition-colors hover:text-ink disabled:opacity-30";

export function QuantityStepper({ value, onChange, min = 0, max, label }: Props) {
  return (
    <div className="inline-flex items-center border border-ink/25" role="group" aria-label={label}>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <span className="w-7 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}
