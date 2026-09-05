import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  filterUnselectedPages,
  pageOptionLabel,
  parsePageIdsInput,
  resolveSelectedPages,
} from '../utils/assignedPages';

export default function AssignedPagesMultiselect({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Buscar por nombre o ID',
}) {
  const selectedIds = parsePageIdsInput(value);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const selectedPages = useMemo(
    () => resolveSelectedPages(options, selectedIds),
    [options, selectedIds],
  );
  const available = useMemo(
    () => filterUnselectedPages(options, selectedIds, query),
    [options, selectedIds, query],
  );

  const selectedKey = selectedIds.join('|');
  useEffect(() => {
    setHighlight(0);
  }, [query, open, selectedKey]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const addId = (id) => {
    onChange(parsePageIdsInput([...selectedIds, id]));
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  };

  const removeId = (id) => {
    onChange(selectedIds.filter((item) => item !== id));
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => Math.min(index + 1, Math.max(available.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (open && available[highlight]) addId(available[highlight].id);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Backspace' && !query && selectedIds.length) {
      removeId(selectedIds[selectedIds.length - 1]);
    }
  };

  const emptyMessage = selectedIds.length > 0 && !query && available.length === 0
    ? 'Todas las páginas visibles ya están asignadas'
    : 'No hay páginas que coincidan';

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex min-h-[2rem] flex-wrap gap-1.5">
        {selectedPages.length === 0 ? (
          <p className="text-[10px] text-gray-400">Ninguna página seleccionada</p>
        ) : selectedPages.map((page) => {
          const label = pageOptionLabel(page);
          return (
            <span
              key={page.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#4A5D4E]/20 bg-[#4A5D4E]/8 py-0.5 pl-2.5 pr-1 text-[11px] text-[#2A342D]"
            >
              <span className="truncate">{label}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeId(page.id)}
                aria-label={`Quitar ${label}`}
                className="rounded-full px-1 text-gray-400 hover:bg-white/80 hover:text-[#2A342D] disabled:opacity-40"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border px-3 py-2 text-xs disabled:bg-gray-100"
        />
        {open && !disabled && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {available.length === 0 ? (
              <li className="px-3 py-2 text-[11px] text-gray-400">{emptyMessage}</li>
            ) : available.map((page, index) => {
              const label = pageOptionLabel(page);
              const showId = Boolean(page.name && page.name !== page.id);
              return (
                <li key={page.id} role="option" aria-selected={index === highlight}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => addId(page.id)}
                    className={`flex w-full flex-col items-start px-3 py-1.5 text-left ${
                      index === highlight ? 'bg-[#4A5D4E]/10' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xs text-gray-800">{label}</span>
                    {showId && (
                      <span className="font-mono text-[10px] text-gray-400">{page.id}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
