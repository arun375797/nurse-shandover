import { useEffect, useId, useMemo, useRef, useState } from 'react';

type CreatableComboboxProps = {
  id?: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

export function CreatableCombobox({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search or enter a value',
  error,
  disabled,
}: CreatableComboboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listboxId = `${inputId}-listbox`;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [...options];
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, value]);

  const items = useMemo(() => {
    const q = value.trim();
    const hasExact = options.some((o) => o.toLowerCase() === q.toLowerCase());
    if (q && !hasExact) {
      return [...filtered, `Use custom: ${q}`];
    }
    return filtered;
  }, [filtered, options, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function selectIndex(index: number) {
    const item = items[index];
    if (!item) return;
    if (item.startsWith('Use custom: ')) {
      onChange(value.trim());
    } else {
      onChange(item);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        className="field-input"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(h + 1, Math.max(items.length - 1, 0)));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            if (open && items.length) {
              e.preventDefault();
              selectIndex(highlight);
            }
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && items.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-300 bg-white shadow-md"
        >
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              role="option"
              aria-selected={index === highlight}
              className={`cursor-pointer px-3 py-2 text-base ${
                index === highlight ? 'bg-teal-50 text-teal-700' : 'text-navy-900'
              }`}
              onMouseEnter={() => setHighlight(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectIndex(index);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
