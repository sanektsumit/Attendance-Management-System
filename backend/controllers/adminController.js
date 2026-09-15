const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { getTodayString } = require('../utils/attendanceCalc');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const todayStr = getTodayString();
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true });
    const todayRecords = await Attendance.find({ date: todayStr });

    const present = todayRecords.filter((r) => r.status === 'PRESENT').length;
    const late = todayRecords.filter((r) => r.status === 'LATE').length;
    const onLeave = todayRecords.filter((r) => r.status === 'ON_LEAVE').length;
    const absent = Math.max(0, totalEmployees - (present + late + onLeave));
    const pendingLeavesCount = await Leave.countDocuments({ status: 'PENDING' });

    const { range = '7d' } = req.query;

    // Determine days count based on filter range
    let daysCount = 7;
    if (range === '10d') daysCount = 10;
    else if (range === '15d') daysCount = 15;
    else if (range === '1m') daysCount = 30;
    else if (range === '3m') daysCount = 90;
    else if (range === '6m') daysCount = 180;
    else if (range === '1y') daysCount = 365;

    // Compute dynamic attendance trend dates from MongoDB
    const trendDates = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      let dayName;
      if (daysCount <= 10) {
        dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        dayName = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      trendDates.push({ dateStr, dayName });
    }

    const dateStrings = trendDates.map((d) => d.dateStr);
    const rangeRecords = await Attendance.find({ date: { $in: dateStrings } });

    // Group records by date for O(1) lookups
    const recordsByDate = {};
    for (const r of rangeRecords) {
      if (!recordsByDate[r.date]) {
        recordsByDate[r.date] = [];
      }
      recordsByDate[r.date].push(r);
    }

    const weeklyTrend = trendDates.map(({ dateStr, dayName }) => {
      const dayRecords = recordsByDate[dateStr] || [];
      const dayPresent = dayRecords.filter((r) => r.status === 'PRESENT').length;
      const dayLate = dayRecords.filter((r) => r.status === 'LATE').length;
      const dayHalfDay = dayRecords.filter((r) => r.status === 'HALF_DAY').length;
      const dayOnLeave = dayRecords.filter((r) => r.status === 'ON_LEAVE').length;
      const dayTotalPunched = dayRecords.length;
      const dayAbsent = Math.max(0, totalEmployees - (dayPresent + dayLate + dayHalfDay + dayOnLeave));

      return {
        day: dayName,
        date: dateStr,
        Present: dayPresent + dayHalfDay,
        Late: dayLate,
        Absent: dayAbsent,
        OnLeave: dayOnLeave,
        Total: dayTotalPunched,
      };
    });

    res.status(200).json({
      success: true,
      stats: { totalEmployees, present, late, absent, onLeave, pendingLeavesCount },
      weeklyTrend,
      range,
      daysCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Employee Directory with filters
// @route   GET /api/v1/admin/employees
// @access  Private/Admin
const getEmployees = async (req, res) => {
  try {
    const { search, department } = req.query;
    let query = { role: 'employee' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'ALL') {
      query.department = department;
    }

    const employees = await User.find(query).sort({ name: 1 }).select('-password');

    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Employee Settings & Shift Timings
// @route   PUT /api/v1/admin/employees/:id
// @access  Private/Admin
const updateEmployee = async (req, res) => {
  try {
    const { name, department, designation, shiftStart, shiftEnd, lateThresholdMinutes } = req.body;
    const empId = req.params.id;

    const updatedUser = await User.findByIdAndUpdate(
      empId,
      {
        ...(name && { name }),
        ...(department && { department }),
        ...(designation && { designation }),
        ...(shiftStart && { shiftStart }),
        ...(shiftEnd && { shiftEnd }),
        ...(lateThresholdMinutes !== undefined && { lateThresholdMinutes }),
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Employee settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Filterable Attendance Report
// @route   GET /api/v1/admin/reports
// @access  Private/Admin
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const records = await Attendance.find(query)
      .populate('user', 'name email department designation')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Map Punch Location Data
// @route   GET /api/v1/admin/map-data
// @access  Private/Admin
const getMapData = async (req, res) => {
  try {
    const date = req.query.date || getTodayString();
    const records = await Attendance.find({ date }).populate('user', 'name email department designation');

    const pins = records.map((r) => ({
      _id: r._id,
      user: r.user,
      date: r.date,
      status: r.status,
      punchInTime: r.punchInTime,
      punchOutTime: r.punchOutTime,
      punchInLocation: r.punchInLocation,
      punchOutLocation: r.punchOutLocation,
    }));

    res.status(200).json({
      success: true,
      date,
      pins,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Employee Account
// @route   DELETE /api/v1/admin/employees/:id
// @access  Private/Admin
const deleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    const user = await User.findByIdAndDelete(empId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee account not found' });
    }

    await Attendance.deleteMany({ user: empId });
    await Leave.deleteMany({ user: empId });

    res.status(200).json({
      success: true,
      message: 'Employee account removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Export Attendance Report to CSV
// @route   GET /api/v1/admin/export-csv
// @access  Private/Admin
const exportCSV = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const records = await Attendance.find(query).populate('user', 'name email department designation');

    let csvHeader = 'Employee Name,Email,Department,Date,Log In Time,Log Out Time,Total Hours,Status,Log In Latitude,Log In Longitude,Log In Address,Log Out Latitude,Log Out Longitude,Log Out Address\n';
    let csvRows = records.map((r) => {
      const name = r.user ? r.user.name : 'Unknown';
      const email = r.user ? r.user.email : 'N/A';
      const dept = r.user ? r.user.department : 'General';
      const inTime = r.punchInTime ? new Date(r.punchInTime).toLocaleTimeString() : 'N/A';
      const outTime = r.punchOutTime ? new Date(r.punchOutTime).toLocaleTimeString() : 'N/A';

      const inLat = r.punchInLocation?.lat || 'N/A';
      const inLng = r.punchInLocation?.lng || 'N/A';
      const inAddress = r.punchInLocation ? `"${(r.punchInLocation.address || '').replace(/"/g, '""')}"` : 'N/A';

      const outLat = r.punchOutLocation?.lat || 'N/A';
      const outLng = r.punchOutLocation?.lng || 'N/A';
      const outAddress = r.punchOutLocation ? `"${(r.punchOutLocation.address || '').replace(/"/g, '""')}"` : 'N/A';

      return `${name},${email},${dept},${r.date},${inTime},${outTime},${r.totalHours},${r.status},${inLat},${inLng},${inAddress},${outLat},${outLng},${outAddress}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getEmployees,
  updateEmployee,
  deleteEmployee,
  getAttendanceReport,
  getMapData,
  exportCSV,
};
