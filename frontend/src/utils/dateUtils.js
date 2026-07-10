export function parseLocalDate(dateString) {
  if (!dateString) return null;
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

export function getMondayBasedDayIndex(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;
  return (date.getDay() + 6) % 7;
}
