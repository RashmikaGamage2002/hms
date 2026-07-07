import { query } from '../config/database.js';

// Get all doctors with optional filtering
export const getDoctors = async (req, res) => {
  try {
    const { specialization, department, isAvailable, sortBy = 'first_name' } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (specialization) {
      whereClause += ` AND d.specialization = ?`;
      params.push(specialization);
    }

    if (department) {
      whereClause += ` AND d.department_id = ?`;
      params.push(department);
    }

    if (isAvailable !== undefined) {
      whereClause += ` AND s.status = ?`;
      params.push(isAvailable === 'true' ? 'Active' : '%Active');
    }

    const doctors = await query(
      `SELECT
        d.doctor_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        d.specialization,
        d.license_number,
        d.years_experience,
        d.consultation_fee,
        d.is_department_head,
        dept.dept_name AS department,
        s.status AS staff_status,
        (SELECT COUNT(*) FROM Appointment a WHERE a.doctor_id = d.doctor_id AND DATE(a.appointment_date) = CURDATE()) AS today_appointments
       FROM Doctor d
       JOIN Person p ON d.doctor_id = p.person_id
       JOIN Staff s ON d.doctor_id = s.staff_id
       LEFT JOIN Department dept ON d.department_id = dept.department_id
       ${whereClause}
       ORDER BY ${sortBy}`,
      params
    );

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message
    });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctors = await query(
      `SELECT
        d.*,
        p.first_name,
        p.last_name,
        p.nic,
        p.email,
        p.phone,
        p.address,
        p.date_of_birth,
        p.gender,
        dept.dept_name AS department
       FROM Doctor d
       JOIN Person p ON d.doctor_id = p.person_id
       LEFT JOIN Department dept ON d.department_id = dept.department_id
       WHERE d.doctor_id = ?`,
      [id]
    );

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get schedule
    const schedule = await query(
      `SELECT * FROM DoctorSchedule WHERE doctor_id = ? ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
      [id]
    );

    // Get today's appointments
    const appointments = await query(
      `SELECT a.*, CONCAT(pt_p.first_name, ' ', pt_p.last_name) AS patient_name
       FROM Appointment a
       JOIN Patient pt ON a.patient_id = pt.patient_id
       JOIN Person pt_p ON pt.patient_id = pt_p.person_id
       WHERE a.doctor_id = ? AND DATE(a.appointment_date) = CURDATE()
       ORDER BY a.appointment_time`,
      [id]
    );

    res.json({
      success: true,
      data: {
        doctor: doctors[0],
        schedule,
        todayAppointments: appointments
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor',
      error: error.message
    });
  }
};

// Get doctor's schedule
export const getDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await query(
      `SELECT * FROM DoctorSchedule
       WHERE doctor_id = ?
       ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
      [id]
    );

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule',
      error: error.message
    });
  }
};

// Add/update doctor schedule
export const setDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable, maxAppointments } = req.body;

    // Check for conflicts
    const conflicts = await query(
      `SELECT * FROM DoctorSchedule
       WHERE doctor_id = ? AND day_of_week = ?
       AND ((start_time BETWEEN ? AND ?) OR (end_time BETWEEN ? AND ?) OR (start_time <= ? AND end_time >= ?))`,
      [id, dayOfWeek, startTime, endTime, startTime, endTime, startTime, endTime]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule conflict detected'
      });
    }

    const result = await query(
      `INSERT INTO DoctorSchedule (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       start_time = VALUES(start_time),
       end_time = VALUES(end_time),
       is_available = VALUES(is_available),
       max_appointments = VALUES(max_appointments)`,
      [id, dayOfWeek, startTime, endTime, isAvailable ?? true, maxAppointments ?? 20]
    );

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      data: {
        scheduleId: result.insertId
      }
    });
  } catch (error) {
    console.error('Set schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message
    });
  }
};

// Get department heads
export const getDepartmentHeads = async (req, res) => {
  try {
    const heads = await query(`
      SELECT
        d.department_id,
        d.dept_name,
        doc.doctor_id,
        CONCAT(p.first_name, ' ', p.last_name) AS head_name,
        doc.license_number,
        doc.years_experience,
        doc.specialization
      FROM Department d
      JOIN Doctor doc ON d.department_id = doc.department_id AND doc.is_department_head = TRUE
      JOIN Person p ON doc.doctor_id = p.person_id
    `);

    res.json({
      success: true,
      data: heads
    });
  } catch (error) {
    console.error('Get department heads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get department heads',
      error: error.message
    });
  }
};

// Get doctor statistics
export const getDoctorStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ?) AS total_appointments,
        (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ? AND status = 'Completed') AS completed_appointments,
        (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ? AND status = 'Cancelled') AS cancelled_appointments,
        (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()) AS today_appointments,
        (SELECT COUNT(DISTINCT patient_id) FROM Appointment WHERE doctor_id = ?) AS unique_patients
    `, [id, id, id, id, id]);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};
