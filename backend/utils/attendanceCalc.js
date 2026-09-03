/**
 * Get current date string in YYYY-MM-DD format based on local time
 */
const getTodayString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Determine if punch-in is LATE or PRESENT based on employee shift start & threshold (Default: 21:00 / 9:00 PM)
 */
const calculateLateStatus = (punchInDate, shiftStartStr = '21:00', lateThresholdMinutes = 15) => {
  const punch = new Date(punchInDate);
  const [hours, minutes] = shiftStartStr.split(':').map(Number);

  const shiftStart = new Date(punch);
  shiftStart.setHours(hours, minutes, 0, 0);

  // Add threshold grace period (e.g. 21:00 + 15 mins = 21:15 / 9:15 PM)
  const graceDeadline = new Date(shiftStart.getTime() + lateThresholdMinutes * 60 * 1000);

  if (punch > graceDeadline) {
    return 'LATE';
  }
  return 'PRESENT';
};

/**
 * Calculate working hours rounded to 2 decimal places
 */
const calculateWorkingHours = (punchInDate, punchOutDate) => {
  if (!punchInDate || !punchOutDate) return 0;
  const diffMs = new Date(punchOutDate).getTime() - new Date(punchInDate).getTime();
  if (diffMs <= 0) return 0;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
};

module.exports = {
  getTodayString,
  calculateLateStatus,
  calculateWorkingHours,
};
