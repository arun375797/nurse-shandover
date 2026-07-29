export function formatDateTime(value: string | Date | undefined, timeZone: string) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date);
}

export function locationLabel(patient: {
  ward?: string;
  room?: string;
  bedNumber?: string;
}) {
  const parts = [patient.ward, patient.room, patient.bedNumber].filter(Boolean);
  return parts.length ? parts.join(' / ') : '—';
}

export function statusLabel(status: string) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'ready':
      return 'Ready';
    case 'acknowledged':
      return 'Acknowledged';
    default:
      return status;
  }
}
