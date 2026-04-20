import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface StylishDropdownOption {
  value: string;
  label: string;
}

interface StylishDropdownProps {
  id?: string;
  label: string;
  placeholder: string;
  value: string;
  options: StylishDropdownOption[];
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export const StylishDropdown: React.FC<StylishDropdownProps> = ({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  disabled = false,
  className,
}) => {
  const autoId = useId();
  const rootId = id ?? autoId;
  const listboxId = `${rootId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('space-y-2', className)}>
      <label
        htmlFor={rootId}
        className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500"
      >
        {label}
      </label>
      <div className="relative">
        <button
          id={rootId}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setOpen(true);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={Boolean(error)}
          className={cn(
            'flex h-12 w-full items-center justify-between gap-3 rounded-2xl border bg-gray-50 px-4 text-left text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-primary/30 focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'
          )}
        >
          <span className={cn('truncate', selectedOption ? 'text-gray-900' : 'text-gray-500')}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown size={16} className="shrink-0 text-gray-400" />
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-labelledby={rootId}
            className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-3xl border border-gray-100 bg-white p-1 shadow-xl"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {active ? <Check size={16} className="shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
};
