const cron = require('node-cron');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { getTodayString } = require('../utils/attendanceCalc');

/**
 * Helper to check if employee is on an active night shift during 23:00 execution
 */
const isOngoingNightShift = (shiftStart, shiftEnd) => {
  if (!shiftStart || !shiftEnd) return false;
  const [startH] = shiftStart.split(':').map(Number);
  const [endH] = shiftEnd.split(':').map(Number);
  // Night shift crosses midnight (e.g. 21:00 to 05:00)
  return startH > endH;
};

/**
 * Executes high-performance night end-of-day attendance resolution via MongoDB bulkWrite
 */
const runEODAttendanceCheck = async () => {
  try {
    console.log('⏰ Running End-Of-Day Attendance Resolution Job...');
    const todayStr = getTodayString();
    const now = new Date();

    const employees = await User.find({ role: 'employee', isActive: true });
    if (employees.length === 0) {
      console.log('✅ End-Of-Day Attendance Resolution Complete (No active employees).');
      return;
    }

    const employeeIds = employees.map((e) => e._id);
    const existingRecords = await Attendance.find({ user: { $in: employeeIds }, date: todayStr });
    const existingUserMap = new Map(existingRecords.map((r) => [String(r.user), r]));

    const activeLeaves = await Leave.find({
      user: { $in: employeeIds },
      status: 'APPROVED',
      startDate: { $lte: todayStr },
      endDate: { $gte: todayStr },
    });
    const leaveUserMap = new Map(activeLeaves.map((l) => [String(l.user), l]));

    const bulkOps = [];
    let markedAbsentCount = 0;
    let markedLeaveCount = 0;
    let autoClosedCount = 0;

    for (const emp of employees) {
      const empIdStr = String(emp._id);
      const record = existingUserMap.get(empIdStr);

      // Skip night-shift workers whose shift is currently active at 23:00
      if (isOngoingNightShift(emp.shiftStart, emp.shiftEnd)) {
        continue;
      }

      if (!record) {
        const leave = leaveUserMap.get(empIdStr);
        if (leave) {
          bulkOps.push({
            insertOne: {
              document: {
                user: emp._id,
                date: todayStr,
                punchInTime: now,
                status: 'ON_LEAVE',
                remark: `Auto-marked: On Approved ${leave.leaveType} Leave`,
                punchSource: 'SYSTEM',
              },
            },
          });
          markedLeaveCount++;
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                user: emp._id,
                date: todayStr,
                punchInTime: now,
                status: 'ABSENT',
                totalHours: 0,
                remark: 'Auto-marked: Absent (No punch-in recorded)',
                punchSource: 'SYSTEM',
              },
            },
          });
          markedAbsentCount++;
        }
      } else if (record.punchInTime && !record.punchOutTime) {
        // Auto-close abandoned daytime punches
        bulkOps.push({
          updateOne: {
            filter: { _id: record._id },
            update: {
              $set: {
                punchOutTime: now,
                totalHours: 8,
                remark: 'System Auto Punch Out at End-of-Day',
              },
            },
          },
        });
        autoClosedCount++;
      }
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    console.log(`✅ End-Of-Day Resolution Complete. (Absent: ${markedAbsentCount}, On Leave: ${markedLeaveCount}, Auto-Closed: ${autoClosedCount})`);
  } catch (error) {
    console.error('❌ Error executing EOD Attendance Cron Job:', error);
  }
};

const initCronJobs = () => {
  // Schedule to run every day at 11:00 PM (23:00)
  cron.schedule('0 23 * * *', () => {
    runEODAttendanceCheck();
  });
  console.log('📅 Attendance Node-Cron Job initialized (Scheduled for 23:00 daily).');
};

module.exports = {
  initCronJobs,
  runEODAttendanceCheck,
};
