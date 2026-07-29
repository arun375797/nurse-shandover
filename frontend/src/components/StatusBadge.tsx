import { statusLabel } from '../utils/format';

const statusStyles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  ready: 'bg-teal-50 text-teal-800 ring-teal-200',
  acknowledged: 'bg-navy-50 text-navy-800 ring-navy-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] ?? 'bg-slate-100 text-slate-700 ring-slate-200'
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
