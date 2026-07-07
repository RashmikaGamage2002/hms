import { query, getConnection } from '../config/database.js';

// Get all wards
export const getWards = async (req, res) => {
  try {
    const { wardType, department } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (wardType) {
      whereClause += ' AND w.ward_type = ?';
      params.push(wardType);
    }

    if (department) {
      whereClause += ' AND w.department_id = ?';
      params.push(department);
    }

    const wards = await query(
      `SELECT
        w.*,
        d.dept_name AS department_name,
        (SELECT COUNT(*) FROM Bed WHERE ward_id = w.ward_id AND status = 'Occupied') AS occupied_beds
       FROM Ward w
       LEFT JOIN Department d ON w.department_id = d.department_id
       ${whereClause}
       ORDER BY w.ward_name`,
      params
    );

    res.json({
      success: true,
      data: wards
    });
  } catch (error) {
    console.error('Get wards error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wards',
      error: error.message
    });
  }
};

// Get ward by ID
export const getWardById = async (req, res) => {
  try {
    const { id } = req.params;

    const wards = await query(
      `SELECT
        w.*,
        d.dept_name AS department_name
       FROM Ward w
       LEFT JOIN Department d ON w.department_id = d.department_id
       WHERE w.ward_id = ?`,
      [id]
    );

    if (!wards || wards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ward not found'
      });
    }

    // Get beds in ward
    const beds = await query(
      `SELECT
        b.*,
        p.patient_code,
        CONCAT(per.first_name, ' ', per.last_name) AS patient_name
       FROM Bed b
       LEFT JOIN BedAssignment ba ON b.bed_id = ba.bed_id AND ba.status = 'Active'
       LEFT JOIN Patient p ON ba.patient_id = p.patient_id
       LEFT JOIN Person per ON p.patient_id = per.person_id
       WHERE b.ward_id = ?
       ORDER BY b.bed_number`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ward: wards[0],
        beds
      }
    });
  } catch (error) {
    console.error('Get ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward',
      error: error.message
    });
  }
};

// Add new ward
export const addWard = async (req, res) => {
  try {
    const { wardName, wardType, floorNumber, totalBeds, departmentId, phone } = req.body;

    if (!wardName || !wardType || !totalBeds) {
      return res.status(400).json({
        success: false,
        message: 'Ward name, type, and total beds are required'
      });
    }

    const result = await query(
      `INSERT INTO Ward (ward_name, ward_type, floor_number, total_beds, available_beds, department_id, phone)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [wardName, wardType, floorNumber, totalBeds, totalBeds, departmentId, phone]
    );

    res.status(201).json({
      success: true,
      message: 'Ward added successfully',
      data: {
        wardId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add ward error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add ward',
      error: error.message
    });
  }
};

// Add bed to ward
export const addBed = async (req, res) => {
  try {
    const { wardId, bedNumber, bedType, floorPosition } = req.body;

    if (!wardId || !bedNumber) {
      return res.status(400).json({
        success: false,
        message: 'Ward ID and bed number are required'
      });
    }

    const result = await query(
      `INSERT INTO Bed (ward_id, bed_number, bed_type, floor_position)
       VALUES (?, ?, ?, ?)`,
      [wardId, bedNumber, bedType || 'General', floorPosition]
    );

    // Update ward available beds
    await query(
      `UPDATE Ward SET available_beds = available_beds + 1, total_beds = total_beds + 1 WHERE ward_id = ?`,
      [wardId]
    );

    res.status(201).json({
      success: true,
      message: 'Bed added successfully',
      data: {
        bedId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bed',
      error: error.message
    });
  }
};

// Assign bed to patient
export const assignBed = async (req, res) => {
  try {
    const { bedId, patientId, assignedBy } = req.body;

    if (!bedId || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Bed ID and patient ID are required'
      });
    }

    // Check bed availability
    const beds = await query(
      `SELECT status, ward_id FROM Bed WHERE bed_id = ?`,
      [bedId]
    );

    if (!beds || beds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (beds[0].status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available'
      });
    }

    // Note: assigned_by references Staff(staff_id), and for staff members, staff_id = person_id
    const result = await query(
      `INSERT INTO BedAssignment (bed_id, patient_id, assigned_by)
       VALUES (?, ?, ?)`,
      [bedId, patientId, assignedBy || req.user?.staffId || req.user?.personId]
    );

    // Trigger will update bed status and ward available_beds
    res.status(201).json({
      success: true,
      message: 'Bed assigned successfully',
      data: {
        assignmentId: result.insertId
      }
    });
  } catch (error) {
    console.error('Assign bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign bed',
      error: error.message
    });
  }
};

// Release bed (discharge patient)
export const releaseBed = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { notes } = req.body;

    // Get current assignment
    const assignments = await query(
      `SELECT * FROM BedAssignment WHERE assignment_id = ? AND status = 'Active'`,
      [assignmentId]
    );

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active bed assignment not found'
      });
    }

    await query(
      `UPDATE BedAssignment SET status = 'Completed', released_date = NOW() WHERE assignment_id = ?`,
      [assignmentId]
    );

    // Trigger will update bed status and ward available_beds

    res.json({
      success: true,
      message: 'Bed released successfully'
    });
  } catch (error) {
    console.error('Release bed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release bed',
      error: error.message
    });
  }
};

// Get bed assignments
export const getBedAssignments = async (req, res) => {
  try {
    const { patientId, wardId, status = 'Active' } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (patientId) {
      whereClause += ' AND ba.patient_id = ?';
      params.push(patientId);
    }

    if (wardId) {
      whereClause += ' AND b.ward_id = ?';
      params.push(wardId);
    }

    if (status) {
      whereClause += ' AND ba.status = ?';
      params.push(status);
    }

    const assignments = await query(
      `SELECT
        ba.assignment_id,
        ba.assigned_date,
        ba.released_date,
        ba.status,
        b.bed_id,
        b.bed_number,
        b.bed_type,
        w.ward_id,
        w.ward_name,
        w.ward_type,
        p.patient_id,
        p.patient_code,
        CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
        per.phone AS patient_phone,
        calculate_stay_duration(p.patient_id) AS stay_days
       FROM BedAssignment ba
       JOIN Bed b ON ba.bed_id = b.bed_id
       JOIN Ward w ON b.ward_id = w.ward_id
       JOIN Patient p ON ba.patient_id = p.patient_id
       JOIN Person per ON p.patient_id = per.person_id
       ${whereClause}
       ORDER BY ba.assigned_date DESC`,
      params
    );

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('Get bed assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bed assignments',
      error: error.message
    });
  }
};

// Get ward statistics
export const getWardStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM Ward) AS total_wards,
        (SELECT SUM(total_beds) FROM Ward) AS total_beds,
        (SELECT SUM(available_beds) FROM Ward) AS available_beds,
        (SELECT COUNT(*) FROM Bed WHERE status = 'Occupied') AS occupied_beds,
        (SELECT COUNT(*) FROM BedAssignment WHERE status = 'Active') AS active_assignments,
        (SELECT AVG(TIMESTAMPDIFF(DAY, assigned_date, COALESCE(released_date, NOW()))) FROM BedAssignment WHERE status = 'Completed') AS avg_stay_days
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get ward stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ward statistics',
      error: error.message
    });
  }
};
