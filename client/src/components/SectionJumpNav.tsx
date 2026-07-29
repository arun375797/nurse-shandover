import { useEffect, useId, useState } from 'react';

type Section = { id: string; label: string };

type SectionJumpNavProps = {
  sections: readonly Section[];
  section: string;
  onSectionChange: (id: string) => void;
};

export function SectionJumpNav({ sections, section, onSectionChange }: SectionJumpNavProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!expanded) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExpanded(false);
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  function jumpTo(id: string) {
    onSectionChange(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setExpanded(false);
  }

  return (
    <div className="lg:hidden">
      {expanded ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-900/30"
          aria-label="Close section menu"
          onClick={() => setExpanded(false)}
        />
      ) : null}

      <div className="fixed right-0 top-32 z-50 flex max-h-[calc(100vh-9.5rem)] flex-col sm:top-28">
        {expanded ? (
          <nav
            id={panelId}
            aria-label="Jump to section"
            className="flex max-h-[calc(100vh-9.5rem)] w-80 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-l-xl border border-r-0 border-teal-600 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-navy-800">Jump to section</p>
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-white"
                aria-label="Minimize section menu"
                onClick={() => setExpanded(false)}
              >
                <ChevronRightIcon />
              </button>
            </div>
            <ul className="overflow-y-auto overscroll-contain p-2">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`w-full rounded-md px-3 py-3.5 text-left text-base font-medium leading-snug transition-colors ${
                      section === s.id
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-navy-800 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                    aria-current={section === s.id ? 'true' : undefined}
                    onClick={() => jumpTo(s.id)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <button
            type="button"
            className="flex items-center justify-center rounded-l-xl border border-r-0 border-teal-600 bg-white/95 p-3 shadow-lg backdrop-blur-sm transition-colors hover:bg-teal-50 active:bg-teal-100"
            aria-expanded={false}
            aria-controls={panelId}
            aria-label="Jump to section"
            onClick={() => setExpanded(true)}
          >
            <ListIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-navy-900">
      <path
        d="M2.5 4.25h11M2.5 8h11M2.5 11.75h11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
