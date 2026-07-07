import { query, getConnection } from '../config/database.js';

// Book new appointment
export const bookAppointment = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      symptoms,
      createdBy
    } = req.body;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Use stored procedure to check conflicts and book
    // Note: createdBy should be receptionist_id (which equals staff_id = person_id for receptionists)
    const result = await query(
      `CALL sp_book_appointment(?, ?, ?, ?, ?, ?, ?, @p_appointment_id)`,
      [
        patientId, doctorId, appointmentDate, appointmentTime,
        appointmentType || 'Consultation', symptoms, createdBy || null
      ]
    );

    const outputResult = await query(`SELECT @p_appointment_id AS appointment_id`);
    const appointmentId = outputResult[0].appointment_id;

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentId
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);

    if (error.sqlState === '45000') {
      return res.status(400).json({
        success: false,
        message: error.sqlMessage || 'Doctor already has an appointment at this time'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
};

// Get all appointments with filtering
export const getAppointments = async (req, res) => {
  try {
    const {
      date,
      doctorId,
      patientId,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (date) {
      whereClause += ` AND DATE(a.appointment_date) = ?`;
      params.push(date);
    }

    if (doctorId) {
      whereClause += ` AND a.doctor_id = ?`;
      params.push(doctorId);
    }

    if (patientId) {
      whereClause += ` AND a.patient_id = ?`;
      params.push(patientId);
    }

    if (status) {
      whereClause += ` AND a.status = ?`;
      params.push(status);
    }

    const appointments = await query(
      `SELECT
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.appointment_type,
        a.status,
        a.symptoms,
        a.notes,
        a.created_at,
        p.patient_code,
        CONCAT(pers.first_name, ' ', pers.last_name) AS patient_name,
        pers.phone AS patient_phone,
        d.doctor_id,
        CONCAT(doc.first_name, ' ', doc.last_name) AS doctor_name,
        doc.specialization,
        doc.consultation_fee
       FROM Appointment a
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Person pers ON p.patient_id = pers.person_id
       JOIN Doctor d ON a.doctor_id = d.doctor_id
       JOIN Person doc ON d.doctor_id = doc.person_id
       ${whereClause}
       ORDER BY a.appointment_date, a.appointment_time
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM Appointment a ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointments = await query(
      `SELECT
        a.*,
        p.patient_code,
        CONCAT(pers.first_name, ' ', pers.last_name) AS patient_name,
        pers.nic AS patient_nic,
        pers.phone AS patient_phone,
        pers.email AS patient_email,
        d.doctor_id,
        CONCAT(doc.first_name, ' ', doc.last_name) AS doctor_name,
        doc.specialization,
        doc.consultation_fee,
        dept.dept_name AS department
       FROM Appointment a
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Person pers ON p.patient_id = pers.person_id
       JOIN Doctor d ON a.doctor_id = d.doctor_id
       JOIN Person doc ON d.doctor_id = doc.person_id
       LEFT JOIN Department dept ON d.department_id = dept.department_id
       WHERE a.appointment_id = ?`,
      [id]
    );

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointments[0]
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment',
      error: error.message
    });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    let updateQuery = 'UPDATE Appointment SET ';
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (notes) {
      updates.push('notes = ?');
      params.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    updateQuery += updates.join(', ') + ' WHERE appointment_id = ?';

    await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await query(
      `UPDATE Appointment SET status = 'Cancelled', notes = CONCAT(IFNULL(notes, ''), '\nCancelled: ', ?) WHERE appointment_id = ?`,
      [reason, id]
    );

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// Get today's appointments
export const getTodaysAppointments = async (req, res) => {
  try {
    const { doctorId } = req.query;

    let whereClause = 'WHERE DATE(a.appointment_date) = CURDATE()';
    const params = [];

    if (doctorId) {
      whereClause += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    const appointments = await query(
      `SELECT
        a.appointment_id,
        a.appointment_time,
        a.appointment_type,
        a.status,
        a.symptoms,
        p.patient_code,
        CONCAT(pers.first_name, ' ', pers.last_name) AS patient_name,
        pers.phone AS patient_phone,
        CONCAT(doc.first_name, ' ', doc.last_name) AS doctor_name,
        doc.specialization
       FROM Appointment a
       JOIN Patient p ON a.patient_id = p.patient_id
       JOIN Person pers ON p.patient_id = pers.person_id
       JOIN Doctor d ON a.doctor_id = d.doctor_id
       JOIN Person doc ON d.doctor_id = doc.person_id
       ${whereClause}
       ORDER BY a.appointment_time`,
      params
    );

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today appointments',
      error: error.message
    });
  }
};

// Get appointment statistics
export const getAppointmentStats = async (req, res) => {
  try {
    const { doctorId, startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (doctorId) {
      whereClause += ' AND doctor_id = ?';
      params.push(doctorId);
    }

    if (startDate) {
      whereClause += ' AND DATE(appointment_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(appointment_date) <= ?';
      params.push(endDate);
    }

    const stats = await query(`
      SELECT
        COUNT(*) AS total_appointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN status = 'No-Show' THEN 1 ELSE 0 END) AS no_show,
        SUM(CASE WHEN status IN ('Pending', 'Confirmed') THEN 1 ELSE 0 END) AS upcoming,
        ROUND(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS completion_rate
      FROM Appointment
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment statistics',
      error: error.message
    });
  }
};
