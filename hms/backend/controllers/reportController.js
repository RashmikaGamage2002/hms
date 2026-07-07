import { query } from '../config/database.js';

// Get patient load report
export const getPatientLoadReport = async (req, res) => {
  try {
    const result = await query(`CALL sp_patient_load_report()`);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get patient load report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient load report',
      error: error.message
    });
  }
};

// Get revenue report
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const result = await query(`CALL sp_revenue_report(?, ?)`, [startDate, endDate]);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue report',
      error: error.message
    });
  }
};

// Get monthly revenue summary
export const getMonthlyRevenue = async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const result = await query(
      `SELECT * FROM vw_monthly_revenue ORDER BY year DESC, month DESC LIMIT ?`,
      [parseInt(months)]
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly revenue',
      error: error.message
    });
  }
};

// Get inventory status report
export const getInventoryReport = async (req, res) => {
  try {
    const { category, includeExpired } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ' AND m.category_id = ?';
      params.push(category);
    }

    if (!includeExpired) {
      whereClause += ' AND i.expiry_date > CURDATE()';
    }

    const result = await query(
      `SELECT
        m.medicine_id,
        m.medicine_name,
        m.generic_name,
        mc.category_name,
        m.dosage_form,
        m.strength,
        SUM(i.stock_quantity) AS total_stock,
        MAX(i.reorder_level) AS reorder_level,
        MIN(i.expiry_date) AS earliest_expiry,
        COUNT(DISTINCT i.inventory_id) AS batch_count,
        CASE
          WHEN SUM(i.stock_quantity) = 0 THEN 'OUT OF STOCK'
          WHEN SUM(i.stock_quantity) <= MAX(i.reorder_level) THEN 'LOW STOCK'
          WHEN MIN(i.expiry_date) <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING SOON'
          ELSE 'OK'
        END AS status
       FROM Medicine m
       LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
       LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
       ${whereClause}
       GROUP BY m.medicine_id, m.medicine_name, m.generic_name, mc.category_name, m.dosage_form, m.strength
       ORDER BY m.medicine_name`,
      params
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory report',
      error: error.message
    });
  }
};

// Get appointment statistics report
export const getAppointmentReport = async (req, res) => {
  try {
    const { startDate, endDate, doctorId, department } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND DATE(a.appointment_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(a.appointment_date) <= ?';
      params.push(endDate);
    }

    if (doctorId) {
      whereClause += ' AND a.doctor_id = ?';
      params.push(doctorId);
    }

    if (department) {
      whereClause += ' AND d.department_id = ?';
      params.push(department);
    }

    const result = await query(
      `SELECT
        d.doctor_id,
        CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
        d.specialization,
        dept.dept_name AS department,
        COUNT(a.appointment_id) AS total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN a.status = 'No-Show' THEN 1 ELSE 0 END) AS no_show,
        SUM(CASE WHEN a.status IN ('Pending', 'Confirmed') THEN 1 ELSE 0 END) AS upcoming,
        ROUND(SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(a.appointment_id), 2) AS completion_rate,
        SUM(a.appointment_id) > 0 ? ROUND(SUM(CASE WHEN a.status = 'Completed' THEN d.consultation_fee ELSE 0 END), 2) : 0 AS estimated_revenue
       FROM Doctor d
       JOIN Person p ON d.doctor_id = p.person_id
       LEFT JOIN Department dept ON d.department_id = dept.department_id
       LEFT JOIN Appointment a ON d.doctor_id = a.doctor_id ${whereClause}
       GROUP BY d.doctor_id, p.first_name, p.last_name, d.specialization, dept.dept_name
       ORDER BY total_appointments DESC`,
      params
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get appointment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment report',
      error: error.message
    });
  }
};

// Get patient demographics report
export const getPatientDemographicsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND pt.registration_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND pt.registration_date <= ?';
      params.push(endDate);
    }

    // Age distribution
    const ageDistribution = await query(
      `SELECT
        CASE
          WHEN calculate_patient_age(pt.patient_id) < 18 THEN '0-17'
          WHEN calculate_patient_age(pt.patient_id) BETWEEN 18 AND 35 THEN '18-35'
          WHEN calculate_patient_age(pt.patient_id) BETWEEN 36 AND 55 THEN '36-55'
          WHEN calculate_patient_age(pt.patient_id) BETWEEN 56 AND 75 THEN '56-75'
          ELSE '75+'
        END AS age_group,
        COUNT(*) AS patient_count
       FROM Patient pt
       ${whereClause}
       GROUP BY age_group
       ORDER BY MIN(calculate_patient_age(pt.patient_id))`,
      params
    );

    // Gender distribution
    const genderDistribution = await query(
      `SELECT
        p.gender,
        COUNT(*) AS patient_count
       FROM Patient pt
       JOIN Person p ON pt.patient_id = p.person_id
       ${whereClause}
       GROUP BY p.gender`,
      params
    );

    // Blood group distribution
    const bloodGroupDistribution = await query(
      `SELECT
        pt.blood_group,
        COUNT(*) AS patient_count
       FROM Patient pt
       ${whereClause}
       GROUP BY pt.blood_group`,
      params
    );

    res.json({
      success: true,
      data: {
        ageDistribution,
        genderDistribution,
        bloodGroupDistribution
      }
    });
  } catch (error) {
    console.error('Get demographics report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get demographics report',
      error: error.message
    });
  }
};

// Get dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    const { role } = req.user;

    const summary = {
      timestamp: new Date().toISOString()
    };

    // Common stats
    const commonStats = await query(`
      SELECT
        (SELECT COUNT(*) FROM Patient WHERE is_active = TRUE) AS active_patients,
        (SELECT COUNT(*) FROM Appointment WHERE DATE(appointment_date) = CURDATE()) AS todays_appointments,
        (SELECT COUNT(*) FROM BedAssignment WHERE status = 'Active') AS current_inpatients
    `);
    summary.common = commonStats[0];

    // Role-specific stats
    if (role === 'Admin') {
      const adminStats = await query(`
        SELECT
          (SELECT COUNT(*) FROM Staff) AS total_staff,
          (SELECT COUNT(*) FROM Doctor) AS total_doctors,
          (SELECT COUNT(*) FROM Bill WHERE status = 'Pending') AS pending_bills,
          (SELECT SUM(final_amount) FROM Bill WHERE DATE(bill_date) = CURDATE()) AS todays_revenue
      `);
      summary.roleSpecific = adminStats[0];
    } else if (role === 'Doctor') {
      const doctorStats = await query(
        `SELECT
          (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()) AS todays_appointments,
          (SELECT COUNT(*) FROM Appointment WHERE doctor_id = ? AND status IN ('Pending', 'Confirmed')) AS upcoming_appointments
        `,
        [req.user.userId, req.user.userId]
      );
      summary.roleSpecific = doctorStats[0];
    } else if (role === 'Pharmacist') {
      const pharmacyStats = await query(`
        SELECT
          (SELECT COUNT(*) FROM vw_low_stock WHERE stock_status != 'OK') AS low_stock_items,
          (SELECT COUNT(*) FROM Dispensing WHERE DATE(dispensing_date) = CURDATE()) AS todays_dispensings
      `);
      summary.roleSpecific = pharmacyStats[0];
    } else if (role === 'Receptionist') {
      const receptionistStats = await query(`
        SELECT
          (SELECT COUNT(*) FROM Appointment WHERE status = 'Pending') AS pending_appointments,
          (SELECT COUNT(*) FROM Patient WHERE DATE(registration_date) = CURDATE()) AS todays_registrations
      `);
      summary.roleSpecific = receptionistStats[0];
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary',
      error: error.message
    });
  }
};
