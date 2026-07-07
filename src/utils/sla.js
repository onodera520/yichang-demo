export function parseSlaToSeconds(value) {
  if (!value || value === '-') return null;

  const parts = String(value).split(':').map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

export function getRemainingSlaSeconds(value, nowMs, anchorMs) {
  const initialSeconds = parseSlaToSeconds(value);
  if (initialSeconds == null) return null;

  const elapsedSeconds = Math.max(0, Math.floor((nowMs - anchorMs) / 1000));
  return Math.max(0, initialSeconds - elapsedSeconds);
}

export function formatSlaSeconds(seconds) {
  if (seconds == null) return '-';

  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');

  return `${hours}:${minutes}:${remainingSeconds}`;
}

export function isSlaUrgent(seconds) {
  return seconds != null && seconds > 0 && seconds < 7200;
}

export function isSlaOverdue(seconds) {
  return seconds === 0;
}
