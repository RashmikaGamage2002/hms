import { query, getConnection } from '../config/database.js';

// Register new patient
export const registerPatient = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      nic,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      bloodGroup,
      height,
      weight,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      insuranceProvider,
      insurancePolicyNumber
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !nic || !email || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Use stored procedure for patient registration
    const result = await query(
      `CALL sp_register_patient(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_patient_id, @p_patient_code)`,
      [
        firstName, lastName, nic, email, phone, address,
        dateOfBirth, gender, bloodGroup, emergencyContactName, emergencyContactPhone
      ]
    );

    // Get output parameters
    const outputResult = await query(`SELECT @p_patient_id AS patient_id, @p_patient_code AS patient_code`);
    const { patient_id, patient_code } = outputResult[0];

    // Insert additional patient details
    await query(
      `UPDATE Patient SET
       height_cm = ?, weight_kg = ?, emergency_contact_relation = ?,
       insurance_provider = ?, insurance_policy_number = ?
       WHERE patient_id = ?`,
      [height, weight, emergencyContactRelation, insuranceProvider, insurancePolicyNumber, patient_id]
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        patientId: patient_id,
        patientCode: patient_code
      }
    });
  } catch (error) {
    console.error('Register patient error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Patient with this NIC or Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message
    });
  }
};

// Get all patients with filtering and pagination
export const getPatients = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      bloodGroup,
      sortBy = 'registration_date',
      order = 'DESC'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.nic LIKE ? OR pt.patient_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (isActive !== undefined) {
      whereClause += ` AND pt.is_active = ?`;
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (bloodGroup) {
      whereClause += ` AND pt.blood_group = ?`;
      params.push(bloodGroup);
    }

    // Whitelist sortBy to prevent SQL injection
    const allowedSortColumns = ['registration_date', 'first_name', 'last_name', 'patient_code'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'registration_date';
    const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM Patient pt JOIN Person p ON pt.patient_id = p.person_id ${whereClause}`,
      params
    );

    // Get patients
    const patients = await query(
      `SELECT
        pt.patient_id,
        pt.patient_code,
        p.first_name,
        p.last_name,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
        p.nic,
        p.email,
        p.phone,
        p.date_of_birth,
        p.gender,
        pt.blood_group,
        pt.height_cm,
        pt.weight_kg,
        pt.registration_date,
        pt.is_active,
        pt.emergency_contact_name,
        pt.emergency_contact_phone,
        pt.insurance_provider,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age
       FROM Patient pt
       JOIN Person p ON pt.patient_id = p.person_id
       ${whereClause}
       ORDER BY ${safeSortBy} ${safeOrder}
       LIMIT ${limitNum} OFFSET ${offset}`,
      [...params]
    );

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          total: countResult[0].total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(countResult[0].total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message
    });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patients = await query(
      `SELECT
        pt.*,
        p.first_name,
        p.last_name,
        p.nic,
        p.email,
        p.phone,
        p.address,
        p.date_of_birth,
        p.gender,
        calculate_patient_age(pt.patient_id) AS age
       FROM Patient pt
       JOIN Person p ON pt.patient_id = p.person_id
       WHERE pt.patient_id = ?`,
      [id]
    );

    if (!patients || patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get medical history
    const medicalHistory = await query(
      `SELECT * FROM MedicalHistory WHERE patient_id = ? ORDER BY recorded_at DESC`,
      [id]
    );

    // Get allergies
    const allergies = await query(
      `SELECT * FROM Allergy WHERE patient_id = ?`,
      [id]
    );

    // Get current bed assignment if any
    const bedAssignment = await query(
      `SELECT ba.*, b.bed_number, b.bed_type, w.ward_name, w.ward_type
       FROM BedAssignment ba
       JOIN Bed b ON ba.bed_id = b.bed_id
       JOIN Ward w ON b.ward_id = w.ward_id
       WHERE ba.patient_id = ? AND ba.status = 'Active'`,
      [id]
    );

    res.json({
      success: true,
      data: {
        patient: patients[0],
        medicalHistory,
        allergies,
        currentBedAssignment: bedAssignment[0] || null
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient',
      error: error.message
    });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      address,
      bloodGroup,
      height,
      weight,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      insuranceProvider,
      insurancePolicyNumber
    } = req.body;

    // Update person table
    await query(
      `UPDATE Person SET
       first_name = ?, last_name = ?, phone = ?, address = ?
       WHERE person_id = ?`,
      [firstName, lastName, phone, address, id]
    );

    // Update patient table
    await query(
      `UPDATE Patient SET
       blood_group = ?, height_cm = ?, weight_kg = ?,
       emergency_contact_name = ?, emergency_contact_phone = ?,
       emergency_contact_relation = ?, insurance_provider = ?,
       insurance_policy_number = ?
       WHERE patient_id = ?`,
      [bloodGroup, height, weight, emergencyContactName, emergencyContactPhone,
       emergencyContactRelation, insuranceProvider, insurancePolicyNumber, id]
    );

    res.json({
      success: true,
      message: 'Patient updated successfully'
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};

// Add medical history
export const addMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { conditionName, diagnosisDate, severity, status, notes } = req.body;

    if (!conditionName) {
      return res.status(400).json({
        success: false,
        message: 'Condition name is required'
      });
    }

    const result = await query(
      `INSERT INTO MedicalHistory (patient_id, condition_name, diagnosis_date, severity, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, conditionName, diagnosisDate, severity, status || 'Active', notes]
    );

    res.status(201).json({
      success: true,
      message: 'Medical history added successfully',
      data: {
        historyId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medical history',
      error: error.message
    });
  }
};

// Add allergy
export const addAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergenName, reactionType, severity, identifiedDate } = req.body;

    if (!allergenName) {
      return res.status(400).json({
        success: false,
        message: 'Allergen name is required'
      });
    }

    const result = await query(
      `INSERT INTO Allergy (patient_id, allergen_name, reaction_type, severity, identified_date)
       VALUES (?, ?, ?, ?, ?)`,
      [id, allergenName, reactionType, severity, identifiedDate || new Date()]
    );

    res.status(201).json({
      success: true,
      message: 'Allergy added successfully',
      data: {
        allergyId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add allergy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add allergy',
      error: error.message
    });
  }
};

// Get patient statistics
export const getPatientStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM Patient WHERE is_active = TRUE) AS activePatients,
        (SELECT COUNT(*) FROM Patient WHERE is_active = FALSE) AS inactivePatients,
        (SELECT COUNT(*) FROM BedAssignment WHERE status = 'Active') AS currentInpatients,
        (SELECT COUNT(*) FROM Appointment WHERE DATE(appointment_date) = CURDATE()) AS todayAppointments
    `);

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
