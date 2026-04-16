import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Search } from 'lucide-react';
import { SUPPORTED_COUNTRIES, countryCodeToFlagEmoji } from '../constants/locales';

const GLOBAL_OPTION = { code: 'GLOBAL', label: 'Global (all markets)' };
const DEFAULT_OPTIONS = [GLOBAL_OPTION, ...SUPPORTED_COUNTRIES];

function OptionIcon({ code }) {
  if (code === 'GLOBAL') {
    return <Globe className="h-4 w-4 text-blue-700" />;
  }
  return (
    <span className="text-base leading-none" aria-hidden="true">
      {countryCodeToFlagEmoji(code)}
    </span>
  );
}

export function GeoSelect({ value, onChange, options = DEFAULT_OPTIONS, className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find(o => o.code === value) ?? options[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      o => o.label.toLowerCase().includes(q) || o.code.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    // focus the search input when the popover opens
    queueMicrotask(() => searchRef.current?.focus());
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleSelect = (code) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-800 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-700/20"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <OptionIcon code={selected.code} />
        <span className="truncate font-semibold">{selected.label}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-200 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search countries..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600"
            />
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">No matches</li>
            )}
            {filtered.map(o => {
              const active = o.code === value;
              return (
                <li key={o.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(o.code)}
                    role="option"
                    aria-selected={active}
                    className={[
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                      active ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <OptionIcon code={o.code} />
                    <span className="font-medium">{o.label}</span>
                    <span className="ml-auto text-xs text-slate-400">{o.code}</span>
                    {active && <Check className="h-4 w-4 text-blue-700" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
