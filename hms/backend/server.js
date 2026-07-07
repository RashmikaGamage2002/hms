import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { testConnection, query } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});


// Test endpoint
app.get('/api/test', async (req, res) => {
  try {
    const result = await query('SELECT 1 as test');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`🔐 Login attempt: ${username}`);

    // 1. Try to find the user in the database first
    let dbUser = null;
    try {
      const users = await query(
        `SELECT u.*, p.first_name, p.last_name, p.email
         FROM UserAccount u
         JOIN Person p ON u.person_id = p.person_id
         WHERE u.username = ?`,
        [username]
      );
      if (users && users.length > 0) {
        dbUser = users[0];
      }
    } catch (dbError) {
      console.error('Database query error during login:', dbError.message);
    }

    // 2. Define valid demo users mapping for backup / checks
    const validUsers = {
      'admin': { role: 'Admin', name: 'Admin User', firstName: 'Admin', lastName: 'User', person_id: 1, role_entity_id: 1 },
      'doctor': { role: 'Doctor', name: 'Dr. John Smith', firstName: 'John', lastName: 'Smith', person_id: 2, role_entity_id: 2 },
      'pharmacist': { role: 'Pharmacist', name: 'Lisa Rajapakse', firstName: 'Lisa', lastName: 'Rajapakse', person_id: 7, role_entity_id: 7 },
      'receptionist': { role: 'Receptionist', name: 'Mary Gunawardena', firstName: 'Mary', lastName: 'Gunawardena', person_id: 9, role_entity_id: 9 }
    };

    let authenticatedUser = null;

    if (dbUser) {
      // Check passwords:
      // a) Bcrypt check with stored hash (normally 'password123')
      // b) Frontend display format: username + '123' (e.g. admin123)
      // c) Default fallback: 'password123'
      let isPasswordCorrect = false;
      try {
        isPasswordCorrect = await bcrypt.compare(password, dbUser.password_hash);
      } catch (err) {
        console.error('Bcrypt compare error:', err);
      }

      if (
        isPasswordCorrect || 
        password === 'password123' || 
        password === `${username}123` ||
        (username.includes('.') && password === `${username.split('.')[0]}123`)
      ) {
        authenticatedUser = {
          id: dbUser.person_id,
          username: dbUser.username,
          role: dbUser.role,
          name: `${dbUser.first_name} ${dbUser.last_name}`,
          firstName: dbUser.first_name,
          lastName: dbUser.last_name,
          role_entity_id: dbUser.role_entity_id
        };
      }
    }

    // 3. Fallback to mock validUsers if database check failed or user not found
    if (!authenticatedUser && validUsers[username]) {
      const mockUser = validUsers[username];
      if (password === 'password123' || password === `${username}123`) {
        authenticatedUser = {
          id: mockUser.person_id,
          username: username,
          role: mockUser.role,
          name: mockUser.name,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role_entity_id: mockUser.role_entity_id
        };
      }
    }

    if (authenticatedUser) {
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token: 'demo-token-' + Date.now(),
          user: authenticatedUser
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    res.json({
      success: true,
      data: {
        id: 1,
        username: 'admin',
        role: 'Admin',
        name: 'Admin User'
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ============================================
// PATIENT ROUTES
// ============================================

// GET all patients
app.get('/api/patients', async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;

    let sql = `
      SELECT 
        p.patient_id,
        p.patient_code,
        per.first_name,
        per.last_name,
        CONCAT(per.first_name, ' ', per.last_name) AS full_name,
        per.nic,
        per.email,
        per.phone,
        per.gender,
        p.blood_group,
        p.is_active,
        p.registration_date,
        TIMESTAMPDIFF(YEAR, per.date_of_birth, CURDATE()) AS age
      FROM Patient p
      JOIN Person per ON p.patient_id = per.person_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ` AND (per.first_name LIKE ? OR per.last_name LIKE ? OR per.nic LIKE ? OR p.patient_code LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY p.patient_id DESC LIMIT ?`;
    params.push(parseInt(limit));

    const patients = await query(sql, params);
    res.json({ success: true, data: { patients, total: patients.length } });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const patients = await query(`
      SELECT 
        p.patient_id,
        p.patient_code,
        per.first_name,
        per.last_name,
        CONCAT(per.first_name, ' ', per.last_name) AS full_name,
        per.nic,
        per.email,
        per.phone,
        per.address,
        per.date_of_birth,
        per.gender,
        p.blood_group,
        p.height_cm,
        p.weight_kg,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.emergency_contact_relation,
        p.registration_date,
        p.is_active,
        TIMESTAMPDIFF(YEAR, per.date_of_birth, CURDATE()) AS age
      FROM Patient p
      JOIN Person per ON p.patient_id = per.person_id
      WHERE p.patient_id = ?
    `, [id]);

    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: patients[0] });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST register patient
app.post('/api/patients', async (req, res) => {
  try {
    const {
      first_name, last_name, nic, email, phone, address,
      date_of_birth, gender, blood_group,
      emergency_contact_name, emergency_contact_phone
    } = req.body;

    const safePhone = phone !== undefined ? phone : null;
    const safeAddress = address !== undefined ? address : null;
    const safeBloodGroup = blood_group !== undefined ? blood_group : null;
    const safeEmergencyName = emergency_contact_name !== undefined ? emergency_contact_name : null;
    const safeEmergencyPhone = emergency_contact_phone !== undefined ? emergency_contact_phone : null;

    const personResult = await query(`
      INSERT INTO Person (first_name, last_name, nic, email, phone, address, date_of_birth, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, nic, email, safePhone, safeAddress, date_of_birth, gender]);

    const personId = personResult.insertId;
    const patientCode = `PAT-${String(personId).padStart(6, '0')}`;

    await query(`
      INSERT INTO Patient (patient_id, patient_code, blood_group, emergency_contact_name, emergency_contact_phone)
      VALUES (?, ?, ?, ?, ?)
    `, [personId, patientCode, safeBloodGroup, safeEmergencyName, safeEmergencyPhone]);

    res.json({
      success: true,
      message: 'Patient registered successfully',
      data: { patient_id: personId, patient_code: patientCode }
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, nic, email, phone, address,
      blood_group, emergency_contact_name, emergency_contact_phone
    } = req.body;

    const safePhone = phone !== undefined ? phone : null;
    const safeAddress = address !== undefined ? address : null;
    const safeBloodGroup = blood_group !== undefined ? blood_group : null;
    const safeEmergencyName = emergency_contact_name !== undefined ? emergency_contact_name : null;
    const safeEmergencyPhone = emergency_contact_phone !== undefined ? emergency_contact_phone : null;

    // Update Person
    await query(`
      UPDATE Person 
      SET first_name = ?, last_name = ?, nic = ?, email = ?, phone = ?, address = ?
      WHERE person_id = ?
    `, [first_name, last_name, nic, email, safePhone, safeAddress, id]);

    // Update Patient
    await query(`
      UPDATE Patient 
      SET blood_group = ?, emergency_contact_name = ?, emergency_contact_phone = ?
      WHERE patient_id = ?
    `, [safeBloodGroup, safeEmergencyName, safeEmergencyPhone, id]);

    res.json({ success: true, message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE soft delete patient
app.delete('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE Patient SET is_active = FALSE WHERE patient_id = ?', [id]);
    res.json({ success: true, message: 'Patient deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH reactivate patient
app.patch('/api/patients/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE Patient SET is_active = TRUE WHERE patient_id = ?', [id]);
    res.json({ success: true, message: 'Patient reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating patient:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// DOCTOR ROUTES
// ============================================

// GET all doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await query(`
      SELECT 
        d.doctor_id,
        per.first_name,
        per.last_name,
        per.nic,
        per.email,
        per.phone,
        per.address,
        per.date_of_birth,
        per.gender,
        CONCAT(per.first_name, ' ', per.last_name) AS full_name,
        d.specialization,
        d.license_number,
        d.years_experience,
        d.consultation_fee,
        d.is_department_head,
        d.image_url,
        dept.dept_name AS department,
        dept.department_id,
        s.status as staff_status
      FROM Doctor d
      JOIN Person per ON d.doctor_id = per.person_id
      JOIN Staff s ON d.doctor_id = s.staff_id
      LEFT JOIN Department dept ON d.department_id = dept.department_id
      WHERE s.status != 'Terminated'
      ORDER BY d.doctor_id
    `);
    res.json({ success: true, data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET department heads / departments list
app.get('/api/doctors/department-heads', async (req, res) => {
  try {
    const departments = await query('SELECT department_id, dept_name FROM Department ORDER BY dept_name');
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching department heads:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single doctor
app.get('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doctors = await query(`
      SELECT 
        d.doctor_id,
        per.first_name,
        per.last_name,
        CONCAT(per.first_name, ' ', per.last_name) AS full_name,
        d.specialization,
        d.license_number,
        d.years_experience,
        d.consultation_fee,
        d.is_department_head,
        d.image_url,
        dept.dept_name AS department
      FROM Doctor d
      JOIN Person per ON d.doctor_id = per.person_id
      LEFT JOIN Department dept ON d.department_id = dept.department_id
      WHERE d.doctor_id = ?
    `, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, data: doctors[0] });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST register doctor
app.post('/api/doctors', async (req, res) => {
  try {
    const {
      first_name, last_name, nic, email, phone, address,
      date_of_birth, gender, specialization, license_number,
      years_experience, consultation_fee, is_department_head, department_id, image_url
    } = req.body;

    const safePhone = phone !== undefined ? phone : null;
    const safeAddress = address !== undefined ? address : null;
    const safeSpecialization = specialization !== undefined ? specialization : null;
    const safeLicense = license_number !== undefined ? license_number : null;
    const safeExperience = years_experience !== undefined ? parseInt(years_experience) : 0;
    const safeFee = consultation_fee !== undefined ? parseFloat(consultation_fee) : 0.00;
    const safeIsHead = is_department_head ? 1 : 0;
    const safeDeptId = department_id !== undefined && department_id !== '' ? parseInt(department_id) : null;
    const safeImageUrl = image_url !== undefined && image_url !== '' ? image_url : null;

    // First insert Person record
    const personResult = await query(`
      INSERT INTO Person (first_name, last_name, nic, email, phone, address, date_of_birth, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, nic, email, safePhone, safeAddress, date_of_birth, gender]);

    const personId = personResult.insertId;
    const employeeCode = `EMP-${String(personId).padStart(6, '0')}`;
    // Then insert Staff record (Required because doctor_id references staff_id)
    await query(`
      INSERT INTO Staff (staff_id, employee_code, hire_date, salary, status)
      VALUES (?, ?, CURRENT_DATE, 0.00, 'Active')
    `, [personId, employeeCode]);

    // Then insert Doctor record
    await query(`
      INSERT INTO Doctor (doctor_id, specialization, license_number, years_experience, consultation_fee, is_department_head, department_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [personId, safeSpecialization, safeLicense, safeExperience, safeFee, safeIsHead, safeDeptId, safeImageUrl]);

    res.json({
      success: true,
      message: 'Doctor registered successfully',
      data: { doctor_id: personId }
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update doctor
app.put('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, nic, email, phone, address,
      date_of_birth, gender, specialization, license_number,
      years_experience, consultation_fee, is_department_head, department_id, image_url
    } = req.body;

    const safePhone = phone !== undefined ? phone : null;
    const safeAddress = address !== undefined ? address : null;
    const safeSpecialization = specialization !== undefined ? specialization : null;
    const safeLicense = license_number !== undefined ? license_number : null;
    const safeExperience = years_experience !== undefined ? parseInt(years_experience) : 0;
    const safeFee = consultation_fee !== undefined ? parseFloat(consultation_fee) : 0.00;
    const safeIsHead = is_department_head ? 1 : 0;
    const safeDeptId = department_id !== undefined && department_id !== '' ? parseInt(department_id) : null;
    const safeImageUrl = image_url !== undefined && image_url !== '' ? image_url : null;

    await query(`
      UPDATE Person 
      SET first_name = ?, last_name = ?, nic = ?, email = ?, phone = ?, address = ?, date_of_birth = ?, gender = ?
      WHERE person_id = ?
    `, [first_name, last_name, nic, email, safePhone, safeAddress, date_of_birth, gender, id]);

    await query(`
      UPDATE Doctor 
      SET specialization = ?, license_number = ?, years_experience = ?, consultation_fee = ?, is_department_head = ?, department_id = ?, image_url = ?
      WHERE doctor_id = ?
    `, [safeSpecialization, safeLicense, safeExperience, safeFee, safeIsHead, safeDeptId, safeImageUrl, id]);

    res.json({ success: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE soft delete doctor
app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("UPDATE Staff SET status = 'Terminated' WHERE staff_id = ?", [id]);
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await query('SELECT department_id, dept_name FROM Department ORDER BY dept_name');
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// APPOINTMENT ROUTES
// ============================================

// GET appointments (with optional status filter)
app.get('/api/appointments', async (req, res) => {
  try {
    const { status, date } = req.query;

    let sql = `
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.status,
        a.symptoms,
        p.patient_id,
        p.patient_code,
        CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
        d.doctor_id,
        CONCAT(doc.first_name, ' ', doc.last_name) AS doctor_name,
        d.specialization
      FROM Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      JOIN Person pat ON p.patient_id = pat.person_id
      JOIN Doctor d ON a.doctor_id = d.doctor_id
      JOIN Person doc ON d.doctor_id = doc.person_id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    if (date) {
      sql += ` AND a.appointment_date = ?`;
      params.push(date);
    }

    sql += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 100`;

    const appointments = await query(sql, params);
    res.json({ success: true, data: { appointments } });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET today's appointments
app.get('/api/appointments/today', async (req, res) => {
  try {
    const appointments = await query(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.appointment_type,
        a.status,
        a.symptoms,
        p.patient_code,
        CONCAT(pat.first_name, ' ', pat.last_name) AS patient_name,
        CONCAT(doc.first_name, ' ', doc.last_name) AS doctor_name
      FROM Appointment a
      JOIN Patient p ON a.patient_id = p.patient_id
      JOIN Person pat ON p.patient_id = pat.person_id
      JOIN Doctor d ON a.doctor_id = d.doctor_id
      JOIN Person doc ON d.doctor_id = doc.person_id
      WHERE a.appointment_date = CURDATE()
      ORDER BY a.appointment_time
    `);
    res.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST book appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime, appointmentType, symptoms, createdBy } = req.body;

    // Check for conflicts
    const conflict = await query(`
      SELECT COUNT(*) AS count FROM Appointment 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
      AND status NOT IN ('Cancelled', 'No-Show')
    `, [doctorId, appointmentDate, appointmentTime]);

    if (conflict[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Doctor already has an appointment at this time'
      });
    }

    const result = await query(`
      INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, appointment_type, symptoms, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [patientId, doctorId, appointmentDate, appointmentTime, appointmentType, symptoms, createdBy || 9]);

    res.json({
      success: true,
      message: 'Appointment booked successfully',
      data: { appointment_id: result.insertId }
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update appointment status
app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await query(`UPDATE Appointment SET status = ? WHERE appointment_id = ?`, [status, id]);

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// PHARMACY ROUTES
// ============================================

// GET all medicines with search
app.get('/api/pharmacy', async (req, res) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT 
        m.medicine_id,
        m.medicine_name,
        m.generic_name,
        m.category_id,
        mc.category_name,
        m.dosage_form,
        m.strength,
        m.unit_price,
        m.requires_prescription,
        COALESCE(SUM(i.stock_quantity), 0) AS current_stock,
        CASE 
          WHEN COALESCE(SUM(i.stock_quantity), 0) <= MAX(i.reorder_level) THEN TRUE 
          ELSE FALSE 
        END AS is_low_stock
      FROM Medicine m
      LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
      LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id AND i.expiry_date > CURDATE()
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      sql += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    sql += ` GROUP BY m.medicine_id, m.medicine_name, m.generic_name, mc.category_name, m.dosage_form, m.strength, m.unit_price, m.requires_prescription
             ORDER BY m.medicine_name LIMIT 100`;

    const medicines = await query(sql, params);
    res.json({ success: true, data: medicines });
  } catch (error) {
    console.error('Error fetching pharmacy:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET inventory
app.get('/api/pharmacy/inventory', async (req, res) => {
  try {
    const { lowStockOnly, expiringSoon } = req.query;

    let whereClause = '1=1';
    if (lowStockOnly === 'true') {
      whereClause += ' AND i.stock_quantity <= i.reorder_level';
    }
    if (expiringSoon === 'true') {
      whereClause += ' AND DATEDIFF(i.expiry_date, CURDATE()) <= 30 AND i.expiry_date > CURDATE()';
    } else {
      whereClause += ' AND i.expiry_date > CURDATE()';
    }

    const inventory = await query(`
      SELECT 
        i.inventory_id,
        i.medicine_id,
        m.medicine_name,
        m.generic_name,
        i.batch_number,
        i.stock_quantity,
        i.reorder_level,
        i.expiry_date,
        i.supplier_name,
        i.unit_cost,
        i.location,
        DATEDIFF(i.expiry_date, CURDATE()) AS days_until_expiry,
        CASE
          WHEN i.stock_quantity = 0 THEN 'OUT'
          WHEN i.stock_quantity <= i.reorder_level THEN 'LOW'
          WHEN DATEDIFF(i.expiry_date, CURDATE()) <= 30 THEN 'EXPIRING'
          ELSE 'OK'
        END AS status
      FROM Inventory i
      JOIN Medicine m ON i.medicine_id = m.medicine_id
      WHERE ${whereClause}
      ORDER BY i.expiry_date ASC
      LIMIT 200
    `);
    res.json({ success: true, data: inventory });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET pharmacy stats
app.get('/api/pharmacy/stats', async (req, res) => {
  try {
    const [[totalMeds], [inStock], [lowStock], [expiring], [dispensedToday]] = await Promise.all([
      query(`SELECT COUNT(*) AS val FROM Medicine`),
      query(`SELECT COUNT(*) AS val FROM Inventory WHERE stock_quantity > 0 AND expiry_date > CURDATE()`),
      query(`SELECT COUNT(*) AS val FROM Inventory WHERE stock_quantity <= reorder_level AND expiry_date > CURDATE()`),
      query(`SELECT COUNT(*) AS val FROM Inventory WHERE DATEDIFF(expiry_date, CURDATE()) <= 30 AND expiry_date > CURDATE()`),
      query(`SELECT COUNT(*) AS val FROM Dispensing WHERE DATE(dispensing_date) = CURDATE()`)
    ]);

    res.json({
      success: true,
      data: {
        total_medicines: totalMeds.val,
        in_stock_items: inStock.val,
        low_stock_count: lowStock.val,
        expiring_count: expiring.val,
        today_dispensings: dispensedToday.val
      }
    });
  } catch (error) {
    console.error('Error fetching pharmacy stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET low stock medicines
app.get('/api/pharmacy/low-stock', async (req, res) => {
  try {
    const lowStock = await query(`
      SELECT 
        m.medicine_id,
        m.medicine_name,
        m.generic_name,
        COALESCE(SUM(i.stock_quantity), 0) AS current_stock,
        MAX(i.reorder_level) AS reorder_level,
        CASE 
          WHEN COALESCE(SUM(i.stock_quantity), 0) = 0 THEN 'OUT OF STOCK'
          ELSE 'LOW STOCK'
        END AS alert_type
      FROM Medicine m
      LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id AND i.expiry_date > CURDATE()
      GROUP BY m.medicine_id, m.medicine_name, m.generic_name
      HAVING COALESCE(SUM(i.stock_quantity), 0) <= MAX(i.reorder_level)
      ORDER BY current_stock ASC
      LIMIT 50
    `);
    res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// PHARMACY ADDITIONAL ROUTES
// ============================================

// POST add new medicine
app.post('/api/pharmacy/medicine', async (req, res) => {
  try {
    const {
      medicine_name, generic_name, category_id, dosage_form, strength,
      unit_price, requires_prescription, batch_number, stock_quantity,
      reorder_level, expiry_date, supplier_name, unit_cost, location
    } = req.body;

    // Insert into Medicine table
    const medicineResult = await query(`
      INSERT INTO Medicine (medicine_name, generic_name, category_id, dosage_form, strength, unit_price, requires_prescription)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [medicine_name, generic_name, category_id || null, dosage_form, strength || null, unit_price, requires_prescription ? 1 : 0]);

    const medicineId = medicineResult.insertId;

    // Insert into Inventory table
    await query(`
      INSERT INTO Inventory (medicine_id, batch_number, stock_quantity, reorder_level, expiry_date, supplier_name, unit_cost, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [medicineId, batch_number, stock_quantity, reorder_level || 10, expiry_date, supplier_name || null, unit_cost || null, location || null]);

    res.json({
      success: true,
      message: 'Medicine added successfully',
      data: { medicine_id: medicineId }
    });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET medicine categories
app.get('/api/pharmacy/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT category_id, category_name 
      FROM MedicineCategory 
      ORDER BY category_name
    `);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update medicine
app.put('/api/pharmacy/medicine/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      medicine_name, generic_name, category_id, dosage_form, strength,
      unit_price, requires_prescription
    } = req.body;

    await query(`
      UPDATE Medicine 
      SET medicine_name = ?, generic_name = ?, category_id = ?, dosage_form = ?, strength = ?, unit_price = ?, requires_prescription = ?
      WHERE medicine_id = ?
    `, [medicine_name, generic_name || null, category_id || null, dosage_form, strength || null, unit_price, requires_prescription ? 1 : 0, id]);

    res.json({ success: true, message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE medicine
app.delete('/api/pharmacy/medicine/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM Medicine WHERE medicine_id = ?", [id]);
    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add inventory batch
app.post('/api/pharmacy/inventory', async (req, res) => {
  try {
    const {
      medicineId, batchNumber, stockQuantity, reorderLevel,
      expiryDate, supplierName, unitCost, location
    } = req.body;

    const result = await query(`
      INSERT INTO Inventory (medicine_id, batch_number, stock_quantity, reorder_level, expiry_date, supplier_name, unit_cost, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [medicineId, batchNumber, stockQuantity, reorderLevel || 10, expiryDate, supplierName || null, unitCost || null, location || null]);

    res.json({ success: true, message: 'Inventory added successfully', data: { inventory_id: result.insertId } });
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update inventory batch
app.put('/api/pharmacy/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      batchNumber, stockQuantity, reorderLevel,
      expiryDate, supplierName, unitCost, location
    } = req.body;

    await query(`
      UPDATE Inventory 
      SET batch_number = ?, stock_quantity = ?, reorder_level = ?, expiry_date = ?, supplier_name = ?, unit_cost = ?, location = ?
      WHERE inventory_id = ?
    `, [batchNumber, stockQuantity, reorderLevel || 10, expiryDate, supplierName || null, unitCost || null, location || null, id]);

    res.json({ success: true, message: 'Inventory updated successfully' });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE inventory batch
app.delete('/api/pharmacy/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM Inventory WHERE inventory_id = ?", [id]);
    res.json({ success: true, message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST dispense stock
app.post('/api/pharmacy/dispense', async (req, res) => {
  try {
    const { prescriptionId, medicineId, quantity, pharmacistId, notes } = req.body;
    
    // Find earliest expiring batch with enough stock
    const batches = await query(`
      SELECT inventory_id, batch_number, stock_quantity 
      FROM Inventory 
      WHERE medicine_id = ? AND stock_quantity >= ? AND expiry_date > CURDATE()
      ORDER BY expiry_date ASC LIMIT 1
    `, [medicineId, quantity]);

    if (batches.length === 0) {
      return res.status(400).json({ success: false, message: 'Not enough stock in any single unexpired batch' });
    }

    const batch = batches[0];
    
    // Create Dispensing record
    await query(`
      INSERT INTO Dispensing (prescription_id, inventory_id, pharmacist_id, quantity, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [prescriptionId, batch.inventory_id, pharmacistId, quantity, notes || null]);

    // Reduce stock
    await query(`
      UPDATE Inventory SET stock_quantity = stock_quantity - ? WHERE inventory_id = ?
    `, [quantity, batch.inventory_id]);

    res.json({ 
      success: true, 
      message: 'Dispensed successfully', 
      data: { batchNumber: batch.batch_number, remainingStock: batch.stock_quantity - quantity } 
    });
  } catch (error) {
    console.error('Error dispensing:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



// ============================================
// DASHBOARD / REPORT ROUTES
// ============================================

// GET dashboard stats
app.get('/api/reports/dashboard', async (req, res) => {
  try {
    // Common stats
    const commonResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM Patient WHERE is_active = TRUE) AS active_patients,
        (SELECT COUNT(*) FROM Appointment WHERE appointment_date = CURDATE()) AS todays_appointments,
        (SELECT COUNT(*) FROM BedAssignment WHERE status = 'Active') AS current_inpatients
    `);

    const common = commonResult[0];

    // Role-specific stats
    const totalStaff = await query(`SELECT COUNT(*) AS count FROM Staff WHERE status = 'Active'`);
    const totalDoctors = await query(`SELECT COUNT(*) AS count FROM Doctor`);
    const pendingBills = await query(`SELECT COUNT(*) AS count FROM Bill WHERE status = 'Pending'`);
    const todaysRevenue = await query(`SELECT COALESCE(SUM(final_amount), 0) AS total FROM Bill WHERE DATE(bill_date) = CURDATE()`);
    const todaysAppointments = await query(`SELECT COUNT(*) AS count FROM Appointment WHERE appointment_date = CURDATE()`);
    const upcomingAppointments = await query(`SELECT COUNT(*) AS count FROM Appointment WHERE appointment_date > CURDATE() AND status IN ('Pending', 'Confirmed')`);
    const lowStockItems = await query(`SELECT COUNT(*) AS count FROM Inventory WHERE stock_quantity <= reorder_level AND expiry_date > CURDATE()`);
    const todaysDispensings = await query(`SELECT COUNT(*) AS count FROM Dispensing WHERE DATE(dispensing_date) = CURDATE()`);
    const pendingAppointments = await query(`SELECT COUNT(*) AS count FROM Appointment WHERE status = 'Pending'`);
    const todaysRegistrations = await query(`SELECT COUNT(*) AS count FROM Patient WHERE DATE(registration_date) = CURDATE()`);

    const roleSpecific = {
      total_staff: totalStaff[0].count,
      total_doctors: totalDoctors[0].count,
      pending_bills: pendingBills[0].count,
      todays_revenue: todaysRevenue[0].total,
      todays_appointments: todaysAppointments[0].count,
      upcoming_appointments: upcomingAppointments[0].count,
      low_stock_items: lowStockItems[0].count,
      todays_dispensings: todaysDispensings[0].count,
      pending_appointments: pendingAppointments[0].count,
      todays_registrations: todaysRegistrations[0].count
    };

    res.json({
      success: true,
      data: {
        common,
        roleSpecific
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET revenue report
app.get('/api/reports/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await query(`
      SELECT 
        DATE(bill_date) AS report_date,
        COUNT(*) AS bill_count,
        SUM(final_amount) AS daily_total
      FROM Bill
      WHERE DATE(bill_date) BETWEEN ? AND ?
        AND status != 'Cancelled'
      GROUP BY DATE(bill_date)
      ORDER BY report_date ASC
    `, [startDate || '2000-01-01', endDate || '2099-12-31']);

    let cumulative = 0;
    let prevTotal = 0;
    const enriched = data.map(row => {
      cumulative += parseFloat(row.daily_total);
      const change = prevTotal > 0 ? parseFloat(row.daily_total) - prevTotal : 0;
      const pct = prevTotal > 0 ? (change / prevTotal) * 100 : 0;
      prevTotal = parseFloat(row.daily_total);

      return {
        ...row,
        cumulative_revenue: cumulative,
        day_over_day_change: change,
        day_over_day_pct: pct
      };
    });

    res.json({ success: true, data: enriched.reverse() }); 
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET patient load report
app.get('/api/reports/patient-load', async (req, res) => {
  try {
    const data = await query(`
      SELECT 
        d.doctor_id,
        CONCAT(per.first_name, ' ', per.last_name) AS doctor_name,
        d.specialization,
        dept.dept_name AS department,
        COUNT(a.appointment_id) AS total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed_appointments,
        SUM(CASE WHEN a.status = 'Pending' THEN 1 ELSE 0 END) AS pending_appointments
      FROM Doctor d
      JOIN Person per ON d.doctor_id = per.person_id
      LEFT JOIN Department dept ON d.department_id = dept.department_id
      LEFT JOIN Appointment a ON d.doctor_id = a.doctor_id
      GROUP BY d.doctor_id, per.first_name, per.last_name, d.specialization, dept.dept_name
      ORDER BY total_appointments DESC
    `);

    const enriched = data.map(row => ({
      ...row,
      total_appointments: parseInt(row.total_appointments) || 0,
      completed_appointments: parseInt(row.completed_appointments) || 0,
      pending_appointments: parseInt(row.pending_appointments) || 0,
      completion_rate: parseInt(row.total_appointments) > 0
        ? (parseInt(row.completed_appointments) / parseInt(row.total_appointments)) * 100
        : 0
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching patient load report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET inventory report
app.get('/api/reports/inventory', async (req, res) => {
  try {
    const data = await query(`
      SELECT 
        m.medicine_id,
        m.medicine_name,
        mc.category_name,
        COALESCE(SUM(i.stock_quantity), 0) AS total_stock,
        COALESCE(MAX(i.reorder_level), 10) AS reorder_level,
        MIN(i.expiry_date) AS earliest_expiry
      FROM Medicine m
      LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
      LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id
      GROUP BY m.medicine_id, m.medicine_name, mc.category_name
      ORDER BY m.medicine_name ASC
    `);

    const enriched = data.map(row => {
      const stock = parseInt(row.total_stock) || 0;
      const reorder = parseInt(row.reorder_level) || 10;
      let status = 'OK';
      if (stock === 0) status = 'OUT OF STOCK';
      else if (stock <= reorder) status = 'LOW STOCK';

      return { ...row, total_stock: stock, reorder_level: reorder, status };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET appointments report
app.get('/api/reports/appointments', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || '2000-01-01';
    const end = endDate || '2099-12-31';

    const data = await query(`
      SELECT 
        d.doctor_id,
        CONCAT(per.first_name, ' ', per.last_name) AS doctor_name,
        d.specialization,
        dept.dept_name AS department,
        COUNT(a.appointment_id) AS total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN a.status = 'No Show' THEN 1 ELSE 0 END) AS no_show
      FROM Doctor d
      JOIN Person per ON d.doctor_id = per.person_id
      LEFT JOIN Department dept ON d.department_id = dept.department_id
      LEFT JOIN Appointment a ON d.doctor_id = a.doctor_id
        AND DATE(a.appointment_date) BETWEEN ? AND ?
      GROUP BY d.doctor_id, per.first_name, per.last_name, d.specialization, dept.dept_name
      ORDER BY total_appointments DESC
    `, [start, end]);

    const enriched = data.map(row => ({
      ...row,
      total_appointments: parseInt(row.total_appointments) || 0,
      completed: parseInt(row.completed) || 0,
      cancelled: parseInt(row.cancelled) || 0,
      no_show: parseInt(row.no_show) || 0,
      completion_rate: parseInt(row.total_appointments) > 0
        ? (parseInt(row.completed) / parseInt(row.total_appointments)) * 100
        : 0
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching appointments report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET demographics report
app.get('/api/reports/demographics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || '2000-01-01';
    const end = endDate || '2099-12-31';

    const genderDistribution = await query(`
      SELECT per.gender, COUNT(*) AS patient_count
      FROM Patient pat
      JOIN Person per ON pat.patient_id = per.person_id
      WHERE DATE(pat.registration_date) BETWEEN ? AND ?
      GROUP BY per.gender
    `, [start, end]);

    const bloodGroupDistribution = await query(`
      SELECT blood_group, COUNT(*) AS patient_count
      FROM Patient
      WHERE blood_group IS NOT NULL
        AND DATE(registration_date) BETWEEN ? AND ?
      GROUP BY blood_group
      ORDER BY patient_count DESC
    `, [start, end]);

    const ageData = await query(`
      SELECT per.date_of_birth
      FROM Patient pat
      JOIN Person per ON pat.patient_id = per.person_id
      WHERE DATE(pat.registration_date) BETWEEN ? AND ?
    `, [start, end]);

    const ageGroups = { '0-18': 0, '19-35': 0, '36-50': 0, '51-65': 0, '65+': 0 };
    const now = new Date().getFullYear();

    ageData.forEach(row => {
      if (!row.date_of_birth) return;
      const age = now - new Date(row.date_of_birth).getFullYear();
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 35) ageGroups['19-35']++;
      else if (age <= 50) ageGroups['36-50']++;
      else if (age <= 65) ageGroups['51-65']++;
      else ageGroups['65+']++;
    });

    const ageDistribution = Object.entries(ageGroups).map(([age_group, patient_count]) => ({
      age_group,
      patient_count
    }));

    res.json({
      success: true,
      data: { genderDistribution, bloodGroupDistribution, ageDistribution }
    });
  } catch (error) {
    console.error('Error fetching demographics report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// WARD ROUTES
// ============================================

// GET all wards
app.get('/api/wards', async (req, res) => {
  try {
    const wards = await query(`
      SELECT 
        w.ward_id,
        w.ward_name,
        w.ward_type,
        w.floor_number,
        w.total_beds,
        w.available_beds,
        w.phone,
        d.dept_name AS department
      FROM Ward w
      LEFT JOIN Department d ON w.department_id = d.department_id
      ORDER BY w.ward_id
    `);
    res.json({ success: true, data: wards });
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET dashboard stats for wards
app.get('/api/wards/stats', async (req, res) => {
  try {
    const statsResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM Ward) AS total_wards,
        (SELECT COUNT(*) FROM Bed) AS total_beds,
        (SELECT COUNT(*) FROM Bed WHERE status = 'Available') AS available_beds,
        (SELECT COUNT(*) FROM Bed WHERE status = 'Occupied') AS occupied_beds,
        (SELECT COUNT(*) FROM BedAssignment WHERE status = 'Active') AS active_assignments,
        (SELECT COALESCE(ROUND(AVG(TIMESTAMPDIFF(DAY, assigned_date, released_date)), 1), 0) 
         FROM BedAssignment WHERE status = 'Completed') AS avg_stay_days
    `);
    res.json({ success: true, data: statsResult[0] });
  } catch (error) {
    console.error('Error fetching ward stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single ward details
app.get('/api/wards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const wardResult = await query(`
      SELECT 
        w.ward_id,
        w.ward_name,
        w.ward_type,
        w.floor_number,
        w.total_beds,
        w.available_beds,
        w.phone,
        d.dept_name AS department_name
      FROM Ward w
      LEFT JOIN Department d ON w.department_id = d.department_id
      WHERE w.ward_id = ?
    `, [id]);

    if (wardResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    const beds = await query(`
      SELECT 
        b.bed_id,
        b.bed_number,
        b.bed_type,
        b.status,
        b.floor_position,
        ba.assignment_id,
        CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
        pat.patient_code
      FROM Bed b
      LEFT JOIN BedAssignment ba ON b.bed_id = ba.bed_id AND ba.status = 'Active'
      LEFT JOIN Patient pat ON ba.patient_id = pat.patient_id
      LEFT JOIN Person per ON pat.patient_id = per.person_id
      WHERE b.ward_id = ?
      ORDER BY b.bed_number
    `, [id]);

    res.json({
      success: true,
      data: {
        ward: wardResult[0],
        beds
      }
    });
  } catch (error) {
    console.error('Error fetching ward details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add new ward
app.post('/api/wards', async (req, res) => {
  try {
    const { wardName, wardType, floorNumber, totalBeds, departmentId, phone } = req.body;

    const result = await query(`
      INSERT INTO Ward (ward_name, ward_type, floor_number, total_beds, available_beds, department_id, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [wardName, wardType, floorNumber, totalBeds, totalBeds, departmentId || null, phone || null]);

    const wardId = result.insertId;

    // Automatically create beds for this ward
    for (let i = 1; i <= totalBeds; i++) {
      const bedNumber = `B-${String(i).padStart(3, '0')}`;
      let bedType = 'General';
      if (['ICU', 'Pediatric', 'Maternity', 'Isolation'].includes(wardType)) {
        bedType = wardType;
      }
      await query(`
        INSERT INTO Bed (ward_id, bed_number, bed_type, status)
        VALUES (?, ?, ?, 'Available')
      `, [wardId, bedNumber, bedType]);
    }

    res.json({
      success: true,
      message: 'Ward created successfully with beds auto-generated',
      data: { ward_id: wardId }
    });
  } catch (error) {
    console.error('Error creating ward:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update ward
app.put('/api/wards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { wardName, wardType, floorNumber, phone } = req.body;

    await query(`
      UPDATE Ward 
      SET ward_name = ?, ward_type = ?, floor_number = ?, phone = ?
      WHERE ward_id = ?
    `, [wardName, wardType, floorNumber, phone || null, id]);

    res.json({ success: true, message: 'Ward updated successfully' });
  } catch (error) {
    console.error('Error updating ward:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE delete ward
app.delete('/api/wards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM Bed WHERE ward_id = ?", [id]);
    await query("DELETE FROM Ward WHERE ward_id = ?", [id]);
    res.json({ success: true, message: 'Ward deleted successfully' });
  } catch (error) {
    console.error('Error deleting ward:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add new bed to ward
app.post('/api/wards/bed', async (req, res) => {
  try {
    const { wardId, bedNumber, bedType, floorPosition } = req.body;

    await query(`
      INSERT INTO Bed (ward_id, bed_number, bed_type, status, floor_position)
      VALUES (?, ?, ?, 'Available', ?)
    `, [wardId, bedNumber, bedType, floorPosition || null]);

    await query(`
      UPDATE Ward 
      SET total_beds = total_beds + 1, 
          available_beds = available_beds + 1 
      WHERE ward_id = ?
    `, [wardId]);

    res.json({ success: true, message: 'Bed added successfully' });
  } catch (error) {
    console.error('Error adding bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST assign patient to bed
app.post('/api/wards/assign', async (req, res) => {
  try {
    const { bedId, patientId, assignedBy } = req.body;

    const bedResult = await query('SELECT ward_id, status FROM Bed WHERE bed_id = ?', [bedId]);
    if (bedResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }
    if (bedResult[0].status === 'Occupied') {
      return res.status(400).json({ success: false, message: 'Bed is already occupied' });
    }

    const wardId = bedResult[0].ward_id;

    await query(`
      INSERT INTO BedAssignment (bed_id, patient_id, assigned_by, status)
      VALUES (?, ?, ?, 'Active')
    `, [bedId, patientId, assignedBy || null]);

    await query("UPDATE Bed SET status = 'Occupied' WHERE bed_id = ?", [bedId]);

    await query('UPDATE Ward SET available_beds = GREATEST(0, available_beds - 1) WHERE ward_id = ?', [wardId]);

    res.json({ success: true, message: 'Patient assigned successfully' });
  } catch (error) {
    console.error('Error assigning bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST release bed
app.post('/api/wards/release/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignmentResult = await query('SELECT bed_id FROM BedAssignment WHERE assignment_id = ?', [assignmentId]);
    if (assignmentResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    const bedId = assignmentResult[0].bed_id;
    const bedResult = await query('SELECT ward_id FROM Bed WHERE bed_id = ?', [bedId]);
    const wardId = bedResult[0].ward_id;

    await query(`
      UPDATE BedAssignment 
      SET status = 'Completed', 
          released_date = CURRENT_TIMESTAMP 
      WHERE assignment_id = ?
    `, [assignmentId]);

    await query("UPDATE Bed SET status = 'Available' WHERE bed_id = ?", [bedId]);

    await query('UPDATE Ward SET available_beds = LEAST(total_beds, available_beds + 1) WHERE ward_id = ?', [wardId]);

    res.json({ success: true, message: 'Bed released successfully' });
  } catch (error) {
    console.error('Error releasing bed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// BILLING ROUTES
// ============================================

// GET pending bills
app.get('/api/billing/pending', async (req, res) => {
  try {
    const bills = await query(`
      SELECT 
        b.bill_id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.final_amount,
        b.status,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        pat.patient_code
      FROM Bill b
      JOIN Patient pat ON b.patient_id = pat.patient_id
      JOIN Person p ON pat.patient_id = p.person_id
      WHERE b.status IN ('Pending', 'Partial')
      ORDER BY b.bill_date DESC
      LIMIT 50
    `);
    res.json({ success: true, data: bills });
  } catch (error) {
    console.error('Error fetching pending bills:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all bills with search
app.get('/api/billing', async (req, res) => {
  try {
    const { search } = req.query;
    let queryStr = `
      SELECT 
        b.bill_id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.final_amount,
        b.status,
        CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
        pat.patient_code,
        COALESCE((SELECT SUM(amount) FROM Payment WHERE bill_id = b.bill_id), 0.00) AS paid_amount
      FROM Bill b
      JOIN Patient pat ON b.patient_id = pat.patient_id
      JOIN Person per ON pat.patient_id = per.person_id
    `;
    
    let params = [];
    if (search) {
      queryStr += `
        WHERE b.bill_number LIKE ? 
           OR per.first_name LIKE ? 
           OR per.last_name LIKE ? 
           OR pat.patient_code LIKE ?
      `;
      const searchWildcard = `%${search}%`;
      params = [searchWildcard, searchWildcard, searchWildcard, searchWildcard];
    }
    
    queryStr += ` ORDER BY b.bill_date DESC LIMIT 100`;
    
    const bills = await query(queryStr, params);
    res.json({ success: true, data: { bills } });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST record payment for a bill
app.post('/api/billing/payment', async (req, res) => {
  try {
    const { billId, amount, paymentMethod, paymentReference } = req.body;

    // Check if bill exists
    const billResult = await query('SELECT final_amount, status FROM Bill WHERE bill_id = ?', [billId]);
    if (billResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Bill not found' });
    }

    const { final_amount } = billResult[0];

    // Insert payment
    await query(`
      INSERT INTO Payment (bill_id, amount, payment_method, payment_reference)
      VALUES (?, ?, ?, ?)
    `, [billId, amount, paymentMethod, paymentReference || null]);

    // Calculate total paid so far
    const totalPaidResult = await query('SELECT COALESCE(SUM(amount), 0.00) AS total_paid FROM Payment WHERE bill_id = ?', [billId]);
    const totalPaid = parseFloat(totalPaidResult[0].total_paid);

    // Determine new status
    let newStatus = 'Pending';
    if (totalPaid >= parseFloat(final_amount)) {
      newStatus = 'Paid';
    } else if (totalPaid > 0) {
      newStatus = 'Partial';
    }

    // Update bill status
    await query('UPDATE Bill SET status = ? WHERE bill_id = ?', [newStatus, billId]);

    res.json({ success: true, message: 'Payment recorded successfully', data: { newStatus } });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST generate new invoice
app.post('/api/billing', async (req, res) => {
  try {
    const { patientId, totalAmount, discountAmount, taxAmount, dueDate, notes } = req.body;

    if (!patientId || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Patient and Total Amount are required' });
    }

    // Auto-generate invoice number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const billNumber = `INV-2026-${randomSuffix}`;

    const total = parseFloat(totalAmount);
    const discount = parseFloat(discountAmount || 0.00);
    const tax = parseFloat(taxAmount || 0.00);
    const finalAmount = total - discount + tax;

    const result = await query(`
      INSERT INTO Bill (bill_number, patient_id, total_amount, discount_amount, tax_amount, final_amount, status, due_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
    `, [billNumber, patientId, total, discount, tax, finalAmount, dueDate || null, notes || null]);

    res.json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        bill_id: result.insertId,
        bill_number: billNumber,
        final_amount: finalAmount
      }
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update invoice
app.put('/api/billing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, discountAmount, taxAmount, dueDate, notes, status } = req.body;

    const total = parseFloat(totalAmount);
    const discount = parseFloat(discountAmount || 0.00);
    const tax = parseFloat(taxAmount || 0.00);
    const finalAmount = total - discount + tax;

    await query(`
      UPDATE Bill 
      SET total_amount = ?, discount_amount = ?, tax_amount = ?, final_amount = ?, status = ?, due_date = ?, notes = ?
      WHERE bill_id = ?
    `, [total, discount, tax, finalAmount, status || 'Pending', dueDate || null, notes || null, id]);

    res.json({ success: true, message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE delete invoice
app.delete('/api/billing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM Payment WHERE bill_id = ?", [id]);
    await query("DELETE FROM Bill WHERE bill_id = ?", [id]);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// 404 HANDLER - MUST BE LAST
// ============================================

app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
  console.log('🔌 Testing database connection...');
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('❌ Cannot start server without database');
    process.exit(1);
  }

  // Migration: Add image_url to Doctor table if not exists
  try {
    await query(`
      ALTER TABLE Doctor 
      ADD COLUMN image_url VARCHAR(1000) DEFAULT NULL
    `);
    console.log('✅ MySQL schema check: Added image_url column to Doctor table');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.sqlState === '42S21') {
      console.log('ℹ️ MySQL schema check: image_url column already exists in Doctor');
    } else {
      console.error('⚠️ MySQL schema migration warning:', error.message);
    }
  }

  // Populate default doctor images for demo profiles if empty
  try {
    const defaultAvatars = {
      2: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=250&auto=format&fit=crop', // Male Doctor (John Smith)
      3: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop', // Female Doctor (Sarah Johnson)
      4: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop', // Male Doctor (Michael Perera)
      5: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=250&auto=format&fit=crop', // Female Doctor (Emily Fernando)
      6: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=250&auto=format&fit=crop'  // Male Doctor (David Silva)
    };

    for (const [id, url] of Object.entries(defaultAvatars)) {
      await query(`
        UPDATE Doctor 
        SET image_url = ? 
        WHERE doctor_id = ? AND (image_url IS NULL OR image_url = '')
      `, [url, parseInt(id)]);
    }
    console.log('✅ MySQL migration: Seeded default high-def profile images for pre-seeded Doctors');
  } catch (error) {
    console.error('⚠️ MySQL default doctor avatars seeding error:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║              Hospital Management System API Server             ║
╠════════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                        
║  URL: http://localhost:${PORT}                                       
║                                                                    ║
║  Available Endpoints:                                              ║
║  ─────────────────────────────────────────────────────────────    ║
║  POST   /api/auth/login                                           ║
║  GET    /api/patients                                             ║
║  GET    /api/doctors                                              ║
║  GET    /api/appointments                                         ║
║  GET    /api/appointments/today                                   ║
║  POST   /api/appointments                                         ║
║  PATCH  /api/appointments/:id/status                              ║
║  GET    /api/pharmacy                                             ║
║  GET    /api/pharmacy/inventory                                   ║
║  GET    /api/pharmacy/low-stock                                   ║
║  GET    /api/reports/dashboard                                    ║
║  GET    /api/wards                                                ║
║  GET    /api/billing/pending                                      ║
║  GET    /health                                                   ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

export default app;