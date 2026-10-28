/**
 * Convert HH:mm string to minutes from start of day
 * @param {string} timeStr - e.g. "09:30"
 * @returns {number}
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Convert minutes from midnight to HH:mm string
 * @param {number} totalMinutes
 * @returns {string}
 */
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Generate discrete 30-minute slot times between startTime (inclusive) and endTime (exclusive)
 * e.g. "09:00" to "10:30" => ["09:00", "09:30", "10:00"]
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {number} intervalMinutes - default 30
 * @returns {string[]}
 */
const generateTimeSlots = (startTime, endTime, intervalMinutes = 30) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    throw new Error('End time must be strictly after start time');
  }

  const slots = [];
  for (let current = start; current < end; current += intervalMinutes) {
    slots.push(minutesToTime(current));
  }
  return slots;
};

/**
 * Parse date and time into a Date object (UTC normalized)
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timeStr - "HH:mm"
 * @returns {Date}
 */
const createDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0));
};

/**
 * Formats a date object to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  createDateTime,
  formatDate,
};
