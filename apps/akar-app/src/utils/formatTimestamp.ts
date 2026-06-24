/**
 * Formats a timestamp for the watermark in the style:
 * "बुधवार, 24/06/2026 10:07 AM GMT +05:30"
 * 
 * Shows: Hindi day name, DD/MM/YYYY, 12h time with AM/PM, GMT offset
 */

const HINDI_DAYS: string[] = [
  'रविवार',   // Sunday
  'सोमवार',   // Monday
  'मंगलवार',  // Tuesday
  'बुधवार',   // Wednesday
  'गुरुवार',  // Thursday
  'शुक्रवार', // Friday
  'शनिवार',   // Saturday
];

/**
 * Formats the GMT offset from minutes to "+HH:MM" / "-HH:MM" string.
 */
function formatGMTOffset(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset(); // getTimezoneOffset returns opposite sign
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
  const mins = String(absMinutes % 60).padStart(2, '0');
  return `${sign}${hours}:${mins}`;
}

export const formatTimestamp = (date: Date): string => {
  const dayName = HINDI_DAYS[date.getDay()];

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 → 12
  const minutesStr = String(minutes).padStart(2, '0');

  const gmtOffset = formatGMTOffset(date);

  return `${dayName}, ${dd}/${mm}/${yyyy} ${hours}:${minutesStr} ${ampm} GMT ${gmtOffset}`;
};
