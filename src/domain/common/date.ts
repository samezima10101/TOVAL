const pad = (value: number): string => String(value).padStart(2, "0");

/** Returns a stable local-calendar date key (YYYY-MM-DD). */
export function localDateKey(value: Date | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now = Date.now()): string {
  return localDateKey(now);
}

/** Capture the local clock along with the instant; later timezone changes must not relabel it. */
export function localTimeKey(value: number): string {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function shiftLocalDateKey(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  if (localDateKey(date) !== value) {
    throw new RangeError("Invalid date key");
  }
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

export function formatLocalDate(value: string): string {
  const parts = value.split("-");
  if (parts.length !== 3) {
    return value;
  }

  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}
