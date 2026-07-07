-- ============================================================
-- Hospital Management System
-- ============================================================

DROP DATABASE IF EXISTS hms;
CREATE DATABASE hms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hms;

-- ============================================================
-- SUPERCLASS TABLES
-- ============================================================

-- Person: Base superclass for all people in the system
CREATE TABLE Person (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    nic VARCHAR(12) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,


    CONSTRAINT chk_nic_format CHECK (LENGTH(nic) BETWEEN 10 AND 12)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Department: Superclass for organizational units
CREATE TABLE Department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    budget DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STAFF SUPERCLASS AND SUBCLASSES
-- ============================================================

-- Staff: Superclass for all hospital employees
CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(12, 2) NOT NULL,
    status ENUM('Active', 'On Leave', 'Terminated', 'Retired') DEFAULT 'Active',
    supervisor_id INT,

    CONSTRAINT fk_staff_person FOREIGN KEY (staff_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_supervisor FOREIGN KEY (supervisor_id) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_salary CHECK (salary >= 0)
) ENGINE=InnoDB;

-- Admin: Subclass of Staff
CREATE TABLE Admin (
    admin_id INT PRIMARY KEY,
    admin_level ENUM('Junior', 'Senior', 'Super') DEFAULT 'Junior',
    access_level INT DEFAULT 1,

    CONSTRAINT fk_admin_staff FOREIGN KEY (admin_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor: Subclass of Staff
CREATE TABLE Doctor (
    doctor_id INT PRIMARY KEY,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    years_experience INT DEFAULT 0,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    is_department_head BOOLEAN DEFAULT FALSE,
    department_id INT,
    image_url VARCHAR(255) NULL,

    CONSTRAINT fk_doctor_staff FOREIGN KEY (doctor_id) REFERENCES Staff(staff_id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_department FOREIGN KEY (department_id) REFERENCES Department(department_id) ON DELETE SET NULL,
    CONSTRAINT chk_experience CHECK (years_experience >= 0),
    CONSTRAINT chk_consultation_fee CHECK (consultation_fee >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pharmacist: Subclass of Staff
CREATE TABLE Pharmacist (
    pharmacist_id INT PRIMARY KEY,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    pharmacy_license VARCHAR(50),
    specialization ENUM('General', 'Clinical', 'Oncology', 'Pediatric') DEFAULT 'General',

    CONSTRAINT fk_pharmacist_staff FOREIGN KEY (pharmacist_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Receptionist: Subclass of Staff
CREATE TABLE Receptionist (
    receptionist_id INT PRIMARY KEY,
    shift ENUM('Morning', 'Afternoon', 'Night') DEFAULT 'Morning',
    counter_number INT,

    CONSTRAINT fk_receptionist_staff FOREIGN KEY (receptionist_id) REFERENCES Staff(staff_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PATIENT TABLES
-- ============================================================

-- Patient: Subclass of Person (can also be modeled as separate table)
CREATE TABLE Patient (
    patient_id INT PRIMARY KEY,
    patient_code VARCHAR(20) UNIQUE NOT NULL,
    registration_date DATE DEFAULT (CURDATE()),
    blood_group VARCHAR(5),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_patient_person FOREIGN KEY (patient_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    CONSTRAINT chk_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_height CHECK (height_cm IS NULL OR height_cm BETWEEN 30 AND 250),
    CONSTRAINT chk_weight CHECK (weight_kg IS NULL OR weight_kg BETWEEN 0.5 AND 500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical History for Patients
CREATE TABLE MedicalHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    condition_name VARCHAR(200) NOT NULL,
    diagnosis_date DATE,
    severity ENUM('Mild', 'Moderate', 'Severe', 'Critical'),
    status ENUM('Active', 'Resolved', 'Chronic') DEFAULT 'Active',
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allergies
CREATE TABLE Allergy (
    allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    allergen_name VARCHAR(100) NOT NULL,
    reaction_type VARCHAR(200),
    severity ENUM('Mild', 'Moderate', 'Severe', 'Life-threatening'),
    identified_date DATE,

    CONSTRAINT fk_allergy_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WARD AND BED MANAGEMENT
-- ============================================================

-- Ward
CREATE TABLE Ward (
    ward_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(100) NOT NULL UNIQUE,
    ward_type ENUM('General', 'ICU', 'CCU', 'Pediatric', 'Maternity', 'Surgical', 'Emergency', 'Isolation') NOT NULL,
    floor_number INT,
    total_beds INT NOT NULL,
    available_beds INT,
    department_id INT,
    phone VARCHAR(20),

    CONSTRAINT fk_ward_department FOREIGN KEY (department_id) REFERENCES Department(department_id) ON DELETE SET NULL,
    CONSTRAINT chk_beds CHECK (total_beds > 0 AND available_beds >= 0 AND available_beds <= total_beds)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bed
CREATE TABLE Bed (
    bed_id INT AUTO_INCREMENT PRIMARY KEY,
    ward_id INT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    bed_type ENUM('General', 'ICU', 'Pediatric', 'Maternity', 'Isolation') DEFAULT 'General',
    status ENUM('Available', 'Occupied', 'Maintenance', 'Reserved') DEFAULT 'Available',
    floor_position VARCHAR(10),

    CONSTRAINT fk_bed_ward FOREIGN KEY (ward_id) REFERENCES Ward(ward_id) ON DELETE CASCADE,
    CONSTRAINT uk_bed_number UNIQUE (ward_id, bed_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bed Assignment (Weak Entity)
CREATE TABLE BedAssignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    bed_id INT NOT NULL,
    patient_id INT NOT NULL,
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    released_date DATETIME,
    assigned_by INT,
    status ENUM('Active', 'Completed', 'Cancelled') DEFAULT 'Active',

    CONSTRAINT fk_assignment_bed FOREIGN KEY (bed_id) REFERENCES Bed(bed_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_staff FOREIGN KEY (assigned_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_assignment_dates CHECK (released_date IS NULL OR released_date >= assigned_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- APPOINTMENT SYSTEM
-- ============================================================

-- Appointment
CREATE TABLE Appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    appointment_type ENUM('Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Checkup') DEFAULT 'Consultation',
    status ENUM('Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Pending',
    symptoms TEXT,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_appointment_patient 
        FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,

    CONSTRAINT fk_appointment_doctor 
        FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id) ON DELETE CASCADE,

    CONSTRAINT fk_appointment_creator 
        FOREIGN KEY (created_by) REFERENCES Receptionist(receptionist_id) ON DELETE SET NULL,

    CONSTRAINT chk_appointment_duration 
        CHECK (duration_minutes > 0 AND duration_minutes <= 180)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Doctor Schedule
CREATE TABLE DoctorSchedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_appointments INT DEFAULT 20,

    CONSTRAINT fk_schedule_doctor FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id) ON DELETE CASCADE,
    CONSTRAINT chk_schedule_time CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHARMACY AND INVENTORY
-- ============================================================

-- Medicine Category
CREATE TABLE MedicineCategory (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INT,

    CONSTRAINT fk_category_parent FOREIGN KEY (parent_category_id) REFERENCES MedicineCategory(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medicine
CREATE TABLE Medicine (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    category_id INT,
    manufacturer VARCHAR(200),
    dosage_form ENUM('Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Other') NOT NULL,
    strength VARCHAR(50),
    unit_price DECIMAL(10, 2) NOT NULL,
    requires_prescription BOOLEAN DEFAULT TRUE,
    is_controlled BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_medicine_category FOREIGN KEY (category_id) REFERENCES MedicineCategory(category_id) ON DELETE SET NULL,
    CONSTRAINT chk_price CHECK (unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory (Stock)
CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    batch_number VARCHAR(50) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT DEFAULT 10,
    expiry_date DATE NOT NULL,
    received_date DATE DEFAULT (CURDATE()),
    supplier_name VARCHAR(200),
    unit_cost DECIMAL(10, 2),
    location VARCHAR(50),

    CONSTRAINT fk_inventory_medicine FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT uk_batch UNIQUE (medicine_id, batch_number),
    CONSTRAINT chk_stock_qty CHECK (stock_quantity >= 0),
    CONSTRAINT chk_reorder_level CHECK (reorder_level >= 0),
    CONSTRAINT chk_expiry_date CHECK (expiry_date > received_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Supplier
CREATE TABLE Supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    license_number VARCHAR(50),
    rating DECIMAL(3, 2) DEFAULT 5.00,

    CONSTRAINT chk_rating CHECK (rating BETWEEN 0 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Order
CREATE TABLE PurchaseOrder (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    order_date DATE DEFAULT (CURDATE()),
    expected_delivery DATE,
    received_date DATE,
    total_amount DECIMAL(15, 2),
    status ENUM('Pending', 'Approved', 'Shipped', 'Received', 'Cancelled') DEFAULT 'Pending',
    ordered_by INT,

    CONSTRAINT fk_order_supplier FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_staff FOREIGN KEY (ordered_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_order_dates CHECK (expected_delivery >= order_date),
    CONSTRAINT chk_received_date CHECK (received_date IS NULL OR received_date >= order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Order Items
CREATE TABLE PurchaseOrderItem (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity_ordered INT NOT NULL,
    quantity_received INT,
    unit_cost DECIMAL(10, 2) NOT NULL,
    batch_number VARCHAR(50),
    expiry_date DATE,

    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id) REFERENCES PurchaseOrder(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_medicine FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT chk_qty_received CHECK (quantity_received IS NULL OR quantity_received <= quantity_ordered)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRESCRIPTION AND DISPENSING (WEAK ENTITIES)
-- ============================================================

-- Medical Record (Weak Entity - depends on Patient and Doctor)
CREATE TABLE MedicalRecord (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    record_date DATE DEFAULT (CURDATE()),
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    is_archived BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_record_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_record_doctor FOREIGN KEY (doctor_id) REFERENCES Doctor(doctor_id) ON DELETE CASCADE,
    CONSTRAINT fk_record_appointment FOREIGN KEY (appointment_id) REFERENCES Appointment(appointment_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prescription (Weak Entity)
CREATE TABLE Prescription (
    prescription_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    medicine_id INT NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INT,
    instructions TEXT,
    quantity_prescribed INT,

    CONSTRAINT fk_prescription_record FOREIGN KEY (record_id) REFERENCES MedicalRecord(record_id) ON DELETE CASCADE,
    CONSTRAINT fk_prescription_medicine FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT chk_prescription_duration CHECK (duration_days IS NULL OR duration_days > 0),
    CONSTRAINT chk_quantity CHECK (quantity_prescribed IS NULL OR quantity_prescribed > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispensing (Weak Entity - depends on Prescription)
CREATE TABLE Dispensing (
    dispensing_id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    pharmacist_id INT NOT NULL,
    medicine_id INT NOT NULL,
    inventory_id INT,
    quantity_dispensed INT NOT NULL,
    dispensing_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    batch_number VARCHAR(50),
    notes TEXT,

    CONSTRAINT fk_dispensing_prescription FOREIGN KEY (prescription_id) REFERENCES Prescription(prescription_id) ON DELETE CASCADE,
    CONSTRAINT fk_dispensing_pharmacist FOREIGN KEY (pharmacist_id) REFERENCES Pharmacist(pharmacist_id) ON DELETE CASCADE,
    CONSTRAINT fk_dispensing_medicine FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id) ON DELETE CASCADE,
    CONSTRAINT fk_dispensing_inventory FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id) ON DELETE SET NULL,
    CONSTRAINT chk_dispensed_qty CHECK (quantity_dispensed > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BILLING AND PAYMENT
-- ============================================================

-- Service Type
CREATE TABLE ServiceType (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    service_category ENUM('Consultation', 'Procedure', 'Test', 'Room', 'Medicine', 'Other') NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT chk_service_price CHECK (base_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bill/Invoice
CREATE TABLE Bill (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('Pending', 'Partial', 'Paid', 'Cancelled', 'Refunded') DEFAULT 'Pending',
    generated_by INT,
    due_date DATE,
    notes TEXT,

    CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES Patient(patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_bill_staff FOREIGN KEY (generated_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_bill_amounts CHECK (total_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0 AND final_amount >= 0),
    CONSTRAINT chk_final_amount CHECK (final_amount = total_amount - discount_amount + tax_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bill Items
CREATE TABLE BillItem (
    bill_item_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    service_id INT,
    medicine_id INT,
    description VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,

    CONSTRAINT fk_billitem_bill FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE,
    CONSTRAINT fk_billitem_service FOREIGN KEY (service_id) REFERENCES ServiceType(service_id) ON DELETE SET NULL,
    CONSTRAINT fk_billitem_medicine FOREIGN KEY (medicine_id) REFERENCES Medicine(medicine_id) ON DELETE SET NULL,
    CONSTRAINT chk_item_amount CHECK (amount = quantity * unit_price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment
CREATE TABLE Payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method ENUM('Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque', 'Online') NOT NULL,
    payment_reference VARCHAR(100),
    received_by INT,
    notes TEXT,

    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_staff FOREIGN KEY (received_by) REFERENCES Staff(staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_payment_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance Provider
CREATE TABLE InsuranceProvider (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    claim_processing_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insurance Claim
CREATE TABLE InsuranceClaim (
    claim_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    provider_id INT NOT NULL,
    claim_number VARCHAR(50) UNIQUE NOT NULL,
    claim_date DATE DEFAULT (CURDATE()),
    claimed_amount DECIMAL(15, 2) NOT NULL,
    approved_amount DECIMAL(15, 2),
    status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid') DEFAULT 'Submitted',
    decision_date DATE,
    rejection_reason TEXT,

    CONSTRAINT fk_claim_bill FOREIGN KEY (bill_id) REFERENCES Bill(bill_id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_provider FOREIGN KEY (provider_id) REFERENCES InsuranceProvider(provider_id) ON DELETE CASCADE,
    CONSTRAINT chk_claim_amounts CHECK (claimed_amount > 0 AND (approved_amount IS NULL OR approved_amount >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUTHENTICATION & AUTHORIZATION
-- ============================================================

-- User Accounts
CREATE TABLE UserAccount (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    person_id INT NOT NULL,
    role ENUM('Admin', 'Doctor', 'Pharmacist', 'Receptionist') NOT NULL,
    role_entity_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_user_person FOREIGN KEY (person_id) REFERENCES Person(person_id) ON DELETE CASCADE,
    CONSTRAINT chk_failed_attempts CHECK (failed_login_attempts >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log
CREATE TABLE AuditLog (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES UserAccount(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STORED FUNCTIONS
-- ============================================================

DELIMITER //

-- Function to calculate patient age
CREATE FUNCTION calculate_patient_age(p_patient_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_dob DATE;
    DECLARE v_age INT;

    SELECT p.date_of_birth INTO v_dob
    FROM Person p
    JOIN Patient pt ON p.person_id = pt.patient_id
    WHERE pt.patient_id = p_patient_id;

    IF v_dob IS NULL THEN
        RETURN NULL;
    END IF;

    SET v_age = TIMESTAMPDIFF(YEAR, v_dob, CURDATE());

    RETURN v_age;
END //

-- Function to calculate hospital stay duration
CREATE FUNCTION calculate_stay_duration(p_patient_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_days INT;

    SELECT COALESCE(
        (SELECT TIMESTAMPDIFF(DAY, MIN(assigned_date), COALESCE(MAX(released_date), CURDATE()))
         FROM BedAssignment
         WHERE patient_id = p_patient_id AND status IN ('Active', 'Completed')),
        0
    ) INTO v_days;

    RETURN v_days;
END //

-- Function to get current stock for a medicine
CREATE FUNCTION get_medicine_stock(p_medicine_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_stock INT;

    SELECT COALESCE(SUM(stock_quantity), 0) INTO v_total_stock
    FROM Inventory
    WHERE medicine_id = p_medicine_id
      AND stock_quantity > 0
      AND expiry_date > CURDATE();

    RETURN v_total_stock;
END //

-- Function to check if medicine is low stock
CREATE FUNCTION is_low_stock(p_medicine_id INT)
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total_stock INT;
    DECLARE v_reorder_level INT;

    SELECT COALESCE(SUM(stock_quantity), 0), COALESCE(MAX(reorder_level), 0)
    INTO v_total_stock, v_reorder_level
    FROM Inventory
    WHERE medicine_id = p_medicine_id
      AND expiry_date > CURDATE()
    GROUP BY medicine_id;

    RETURN v_total_stock <= v_reorder_level;
END //

-- Function to generate bill number
CREATE FUNCTION generate_bill_number()
RETURNS VARCHAR(30)
DETERMINISTIC
BEGIN
    DECLARE v_year CHAR(4);
    DECLARE v_month CHAR(2);
    DECLARE v_seq INT;
    DECLARE v_bill_no VARCHAR(30);

    SET v_year = YEAR(CURDATE());
    SET v_month = LPAD(MONTH(CURDATE()), 2, '0');

    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(bill_number, '-', -1) AS UNSIGNED)), 0) + 1 INTO v_seq
    FROM Bill
    WHERE bill_number LIKE CONCAT('BILL-', v_year, v_month, '-%');

    SET v_bill_no = CONCAT('BILL-', v_year, v_month, '-', LPAD(v_seq, 6, '0'));

    RETURN v_bill_no;
END //

DELIMITER ;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER //

-- Procedure to generate invoice
CREATE PROCEDURE sp_generate_invoice(
    IN p_patient_id INT,
    IN p_generated_by INT,
    OUT p_bill_id INT,
    OUT p_bill_number VARCHAR(30)
)
BEGIN
    DECLARE v_total DECIMAL(15, 2) DEFAULT 0;
    DECLARE v_discount DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_tax DECIMAL(10, 2) DEFAULT 0;
    DECLARE v_final DECIMAL(15, 2) DEFAULT 0;
    DECLARE v_bill_no VARCHAR(30);

    -- Generate unique bill number
    SET v_bill_no = generate_bill_number();

    -- Calculate total from bill items (pending items)
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM BillItem
WHERE bill_id IS NULL;

    -- Calculate tax (e.g., 8%)
    SET v_tax = v_total * 0.08;

    -- Calculate final amount
    SET v_final = v_total - v_discount + v_tax;

    -- Insert the bill
    INSERT INTO Bill (bill_number, patient_id, total_amount, discount_amount, tax_amount, final_amount, generated_by)
    VALUES (v_bill_no, p_patient_id, v_total, v_discount, v_tax, v_final, p_generated_by);

    -- Return the bill ID and number
    SET p_bill_id = LAST_INSERT_ID();
    SET p_bill_number = v_bill_no;
END //

-- Procedure to register patient
CREATE PROCEDURE sp_register_patient(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_nic VARCHAR(12),
    IN p_email VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_address TEXT,
    IN p_dob DATE,
    IN p_gender VARCHAR(10),
    IN p_blood_group VARCHAR(5),
    IN p_emergency_contact_name VARCHAR(100),
    IN p_emergency_contact_phone VARCHAR(20),
    OUT p_patient_id INT,
    OUT p_patient_code VARCHAR(20)
)
BEGIN
    DECLARE v_person_id INT;
    DECLARE v_seq INT;
    DECLARE v_code VARCHAR(20);

    -- Start transaction
    START TRANSACTION;

    -- Insert into Person table
    INSERT INTO Person (first_name, last_name, nic, email, phone, address, date_of_birth, gender)
    VALUES (p_first_name, p_last_name, p_nic, p_email, p_phone, p_address, p_dob, p_gender);

    SET v_person_id = LAST_INSERT_ID();

    -- Generate patient code
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_code, 4) AS UNSIGNED)), 0) + 1 INTO v_seq
    FROM Patient WHERE patient_code LIKE 'PAT-%';

    SET v_code = CONCAT('PAT-', LPAD(v_seq, 6, '0'));

    -- Insert into Patient table
    INSERT INTO Patient (patient_id, patient_code, blood_group, emergency_contact_name, emergency_contact_phone)
    VALUES (v_person_id, v_code, p_blood_group, p_emergency_contact_name, p_emergency_contact_phone);

    SET p_patient_id = v_person_id;
    SET p_patient_code = v_code;

    COMMIT;
END //

-- Procedure to book appointment
CREATE PROCEDURE sp_book_appointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_appointment_date DATE,
    IN p_appointment_time TIME,
    IN p_appointment_type VARCHAR(20),
    IN p_symptoms TEXT,
    IN p_created_by INT,
    OUT p_appointment_id INT
)
BEGIN
    DECLARE v_conflict_count INT;
    DECLARE v_schedule_exists INT DEFAULT 0;
    DECLARE v_day_name VARCHAR(10);

    -- Check for appointment conflicts
    SELECT COUNT(*) INTO v_conflict_count
    FROM Appointment
    WHERE doctor_id = p_doctor_id
      AND appointment_date = p_appointment_date
      AND appointment_time = p_appointment_time
      AND status NOT IN ('Cancelled', 'No-Show');

    -- Get day name for schedule check
    SET v_day_name = DAYNAME(p_appointment_date);

    -- Check if doctor has a schedule for this day
    SELECT COUNT(*) INTO v_schedule_exists
    FROM DoctorSchedule
    WHERE doctor_id = p_doctor_id
      AND day_of_week = v_day_name
      AND p_appointment_time BETWEEN start_time AND end_time
      AND is_available = TRUE;

    -- Check for conflicts
    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor already has an appointment at this time';
    END IF;

    -- Check if doctor is available on this day
    IF v_schedule_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor not available on this day/time';
    END IF;

    -- Insert the appointment
    INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time,
                             appointment_type, symptoms, created_by)
    VALUES (p_patient_id, p_doctor_id, p_appointment_date, p_appointment_time,
            p_appointment_type, p_symptoms, p_created_by);

    SET p_appointment_id = LAST_INSERT_ID();
END //

-- Procedure to dispense medicine (with inventory update via trigger)
CREATE PROCEDURE sp_dispense_medicine(
    IN p_prescription_id INT,
    IN p_medicine_id INT,
    IN p_quantity INT,
    IN p_pharmacist_id INT,
    OUT p_dispensing_id INT
)
BEGIN
    DECLARE v_inventory_id INT;
    DECLARE v_available_stock INT;

    -- Get inventory with earliest expiry (FEFO - First Expired First Out)
    SELECT inventory_id, stock_quantity INTO v_inventory_id, v_available_stock
    FROM Inventory
    WHERE medicine_id = p_medicine_id
      AND stock_quantity >= p_quantity
      AND expiry_date > CURDATE()
    ORDER BY expiry_date ASC
    LIMIT 1;

    IF v_inventory_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient stock for this medicine';
    END IF;

    -- Insert dispensing record
    INSERT INTO Dispensing (prescription_id, medicine_id, pharmacist_id, inventory_id, quantity_dispensed, batch_number)
    VALUES (p_prescription_id, p_medicine_id, p_pharmacist_id, v_inventory_id, p_quantity,
            (SELECT batch_number FROM Inventory WHERE inventory_id = v_inventory_id));

    SET p_dispensing_id = LAST_INSERT_ID();

    -- Note: Inventory deduction is handled by trigger
END //

-- Procedure to get low stock medicines
CREATE PROCEDURE sp_get_low_stock_medicines()
BEGIN
    SELECT
        m.medicine_id,
        m.medicine_name,
        m.generic_name,
        mc.category_name,
        SUM(i.stock_quantity) AS total_stock,
        MAX(i.reorder_level) AS reorder_level,
        CASE
            WHEN SUM(i.stock_quantity) <= MAX(i.reorder_level) THEN 'LOW'
            WHEN SUM(i.stock_quantity) = 0 THEN 'OUT'
            ELSE 'OK'
        END AS stock_status
    FROM Medicine m
    LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
    LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id AND i.expiry_date > CURDATE()
    GROUP BY m.medicine_id, m.medicine_name, m.generic_name, mc.category_name
    HAVING SUM(i.stock_quantity) <= MAX(i.reorder_level) OR SUM(i.stock_quantity) IS NULL
    ORDER BY total_stock ASC;
END //

-- Procedure to get medicine expiry alerts
CREATE PROCEDURE sp_get_expiring_medicines(IN p_days INT)
BEGIN
    SELECT
        m.medicine_name,
        m.generic_name,
        i.batch_number,
        i.stock_quantity,
        i.expiry_date,
        DATEDIFF(i.expiry_date, CURDATE()) AS days_until_expiry
    FROM Inventory i
    JOIN Medicine m ON i.medicine_id = m.medicine_id
    WHERE i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL p_days DAY)
      AND i.expiry_date > CURDATE()
      AND i.stock_quantity > 0
    ORDER BY i.expiry_date ASC;
END //

-- Procedure to generate revenue report using window functions
CREATE PROCEDURE sp_revenue_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    WITH DailyRevenue AS (
        SELECT
            DATE(bill_date) AS report_date,
            COUNT(*) AS bill_count,
            SUM(final_amount) AS daily_total
        FROM Bill
        WHERE DATE(bill_date) BETWEEN p_start_date AND p_end_date
          AND status != 'Cancelled'
        GROUP BY DATE(bill_date)
    )
    SELECT
        report_date,
        bill_count,
        daily_total,
        SUM(daily_total) OVER (ORDER BY report_date) AS cumulative_revenue,
        AVG(daily_total) OVER (ORDER BY report_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7day,
        daily_total - LAG(daily_total, 1) OVER (ORDER BY report_date) AS day_over_day_change,
        ROUND((daily_total - LAG(daily_total, 1) OVER (ORDER BY report_date)) /
              NULLIF(LAG(daily_total, 1) OVER (ORDER BY report_date), 0) * 100, 2) AS day_over_day_pct
    FROM DailyRevenue
    ORDER BY report_date;
END //

-- Procedure to get patient load report
CREATE PROCEDURE sp_patient_load_report()
BEGIN
    SELECT
        d.doctor_id,
        CONCAT(p.first_name, ' ', p.last_name) AS doctor_name,
        d.specialization,
        dept.dept_name AS department,
        COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) AS completed_appointments,
        COUNT(CASE WHEN a.status = 'Pending' OR a.status = 'Confirmed' THEN 1 END) AS pending_appointments,
        COUNT(CASE WHEN a.status = 'Cancelled' THEN 1 END) AS cancelled_appointments,
        COUNT(*) AS total_appointments,
        ROUND(COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) * 100.0 / COUNT(*), 2) AS completion_rate
    FROM Doctor d
    JOIN Person p ON d.doctor_id = p.person_id
    LEFT JOIN Department dept ON d.department_id = dept.department_id
    LEFT JOIN Appointment a ON d.doctor_id = a.doctor_id
        AND a.appointment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY d.doctor_id, p.first_name, p.last_name, d.specialization, dept.dept_name
    ORDER BY total_appointments DESC;
END //

-- Procedure to archive old records
CREATE PROCEDURE sp_archive_old_records(IN p_years_ago INT)
BEGIN
    DECLARE v_cutoff_date DATE;
    SET v_cutoff_date = DATE_SUB(CURDATE(), INTERVAL p_years_ago YEAR);

    -- Archive old completed appointments
    UPDATE Appointment
    SET status = 'Completed'
    WHERE appointment_date < v_cutoff_date AND status IN ('Pending', 'Confirmed');

    -- Archive old medical records
    UPDATE MedicalRecord
    SET is_archived = TRUE
    WHERE record_date < v_cutoff_date;
END //

-- Procedure to forecast patient admission trends using window functions and 2-month moving average
CREATE PROCEDURE sp_patient_trend_forecast(IN p_months INT)
BEGIN
    WITH MonthlyAdmissions AS (
        SELECT 
            DATE_FORMAT(registration_date, '%Y-%m') AS month,
            COUNT(*) AS admissions
        FROM Patient
        GROUP BY DATE_FORMAT(registration_date, '%Y-%m')
        ORDER BY month ASC
    ),
    TrendAnalysis AS (
        SELECT 
            month,
            admissions,
            LAG(admissions, 1) OVER (ORDER BY month) AS prev_month,
            ROUND(
                (admissions - LAG(admissions, 1) OVER (ORDER BY month)) * 100.0 / 
                NULLIF(LAG(admissions, 1) OVER (ORDER BY month), 0), 
                2
            ) AS growth_pct,
            ROUND(
                AVG(admissions) OVER (
                    ORDER BY month 
                    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
                ), 
                1
            ) AS forecast_next_month
        FROM MonthlyAdmissions
    )
    SELECT 
        month,
        admissions,
        COALESCE(prev_month, 0) AS prev_month,
        COALESCE(growth_pct, 0.00) AS growth_pct,
        forecast_next_month
    FROM TrendAnalysis
    ORDER BY month DESC
    LIMIT p_months;
END //

-- Procedure to forecast hospital revenue trends using window functions and 2-month moving average
CREATE PROCEDURE sp_revenue_trend_forecast(IN p_months INT)
BEGIN
    WITH MonthlyRevenue AS (
        SELECT 
            DATE_FORMAT(bill_date, '%Y-%m') AS month,
            SUM(final_amount) AS revenue
        FROM Bill
        WHERE status != 'Cancelled'
        GROUP BY DATE_FORMAT(bill_date, '%Y-%m')
        ORDER BY month ASC
    ),
    TrendAnalysis AS (
        SELECT 
            month,
            revenue,
            LAG(revenue, 1) OVER (ORDER BY month) AS prev_month,
            ROUND(
                (revenue - LAG(revenue, 1) OVER (ORDER BY month)) * 100.0 / 
                NULLIF(LAG(revenue, 1) OVER (ORDER BY month), 0), 
                2
            ) AS growth_pct,
            ROUND(
                AVG(revenue) OVER (
                    ORDER BY month 
                    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
                ), 
                2
            ) AS forecast_next_month
        FROM MonthlyRevenue
    )
    SELECT 
        month,
        revenue,
        COALESCE(prev_month, 0.00) AS prev_month,
        COALESCE(growth_pct, 0.00) AS growth_pct,
        forecast_next_month
    FROM TrendAnalysis
    ORDER BY month DESC
    LIMIT p_months;
END //

DELIMITER ;


-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER //

-- Trigger: Auto-deduct inventory on dispensing
CREATE TRIGGER trg_after_dispensing_insert
AFTER INSERT ON Dispensing
FOR EACH ROW
BEGIN
    -- Update inventory stock
    UPDATE Inventory
    SET stock_quantity = stock_quantity - NEW.quantity_dispensed
    WHERE inventory_id = NEW.inventory_id;
END //

-- Trigger: Update bed availability when patient assigned
CREATE TRIGGER trg_after_bed_assignment_insert
AFTER INSERT ON BedAssignment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Active' THEN
        UPDATE Bed SET status = 'Occupied' WHERE bed_id = NEW.bed_id;
        UPDATE Ward SET available_beds = available_beds - 1 WHERE ward_id = (SELECT ward_id FROM Bed WHERE bed_id = NEW.bed_id);
    END IF;
END //

-- Trigger: Update bed availability when patient released
CREATE TRIGGER trg_after_bed_assignment_update
AFTER UPDATE ON BedAssignment
FOR EACH ROW
BEGIN
    IF OLD.status = 'Active' AND NEW.status = 'Completed' AND NEW.released_date IS NOT NULL THEN
        UPDATE Bed SET status = 'Available' WHERE bed_id = NEW.bed_id;
        UPDATE Ward SET available_beds = available_beds + 1 WHERE ward_id = (SELECT ward_id FROM Bed WHERE bed_id = NEW.bed_id);
    END IF;
END //

-- Trigger: Prevent dispensing if insufficient stock
CREATE TRIGGER trg_before_dispensing_insert
BEFORE INSERT ON Dispensing
FOR EACH ROW
BEGIN
    DECLARE v_available INT;

    SELECT stock_quantity INTO v_available
    FROM Inventory
    WHERE inventory_id = NEW.inventory_id;

    IF v_available < NEW.quantity_dispensed THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot dispense: insufficient stock';
    END IF;
END //

-- Trigger: Auto-update patient status when discharged
CREATE TRIGGER trg_after_bed_assignment_release
AFTER UPDATE ON BedAssignment
FOR EACH ROW
BEGIN
    IF OLD.status = 'Active' AND NEW.status = 'Completed' THEN
        -- Check if patient has any other active bed assignments
        IF NOT EXISTS (SELECT 1 FROM BedAssignment WHERE patient_id = NEW.patient_id AND status = 'Active') THEN
            UPDATE Patient SET is_active = FALSE WHERE patient_id = NEW.patient_id;
        END IF;
    END IF;
END //

-- Trigger: Audit logging for sensitive tables
CREATE TRIGGER trg_after_patient_update
AFTER UPDATE ON Patient
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (action, table_name, record_id, old_values, new_values)
    VALUES ('UPDATE', 'Patient', NEW.patient_id,
            JSON_OBJECT('blood_group', OLD.blood_group, 'weight_kg', OLD.weight_kg),
            JSON_OBJECT('blood_group', NEW.blood_group, 'weight_kg', NEW.weight_kg));
END //

-- Trigger: Validate appointment time against doctor schedule
CREATE TRIGGER trg_before_appointment_insert
BEFORE INSERT ON Appointment
FOR EACH ROW
BEGIN
    DECLARE v_schedule_exists INT DEFAULT 0;
    DECLARE v_day_name VARCHAR(10);
    DECLARE v_conflict_count INT DEFAULT 0;

    SET v_day_name = DAYNAME(NEW.appointment_date);

    -- Check for existing appointments at this time
    SELECT COUNT(*) INTO v_conflict_count
    FROM Appointment
    WHERE doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date
      AND appointment_time = NEW.appointment_time
      AND status NOT IN ('Cancelled', 'No-Show');

    -- Check for conflicts
    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor already has an appointment at this time';
    END IF;

    -- Check if doctor has a schedule for this day
    SELECT COUNT(*) INTO v_schedule_exists
    FROM DoctorSchedule
    WHERE doctor_id = NEW.doctor_id
      AND day_of_week = v_day_name
      AND NEW.appointment_time BETWEEN start_time AND end_time
      AND is_available = TRUE;

    -- Enforce schedule validation
    IF v_schedule_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Doctor not available on this day/time';
    END IF;
END //

-- Trigger: Prevent negative stock
CREATE TRIGGER trg_before_inventory_update
BEFORE UPDATE ON Inventory
FOR EACH ROW
BEGIN
    IF NEW.stock_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock quantity cannot be negative';
    END IF;
END //

DELIMITER ;

-- ============================================================
-- VIEWS FOR REPORTING
-- ============================================================

-- View: Active patients with current ward info
CREATE OR REPLACE VIEW vw_active_patients AS
SELECT
    pt.patient_id,
    pt.patient_code,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    p.nic,
    p.phone,
    pt.blood_group,
    calculate_patient_age(pt.patient_id) AS age,
    w.ward_name,
    w.ward_type,
    b.bed_number,
    ba.assigned_date,
    calculate_stay_duration(pt.patient_id) AS stay_days
FROM Patient pt
JOIN Person p ON pt.patient_id = p.person_id
JOIN BedAssignment ba ON pt.patient_id = ba.patient_id AND ba.status = 'Active'
JOIN Bed b ON ba.bed_id = b.bed_id
JOIN Ward w ON b.ward_id = w.ward_id
WHERE pt.is_active = TRUE;

-- View: Today's appointments
CREATE OR REPLACE VIEW vw_todays_appointments AS
SELECT
    a.appointment_id,
    a.appointment_time,
    CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
    CONCAT(d.first_name, ' ', d.last_name) AS doctor_name,
    doc.specialization,
    a.appointment_type,
    a.status,
    a.symptoms
FROM Appointment a
JOIN Patient pt ON a.patient_id = pt.patient_id
JOIN Person p ON pt.patient_id = p.person_id
JOIN Doctor doc ON a.doctor_id = doc.doctor_id
JOIN Person d ON doc.doctor_id = d.person_id
WHERE a.appointment_date = CURDATE()
ORDER BY a.appointment_time;

-- View: Low stock medicines
CREATE OR REPLACE VIEW vw_low_stock AS
SELECT
    m.medicine_id,
    m.medicine_name,
    m.generic_name,
    SUM(i.stock_quantity) AS current_stock,
    MAX(i.reorder_level) AS reorder_level,
    CASE
        WHEN SUM(i.stock_quantity) = 0 THEN 'OUT OF STOCK'
        WHEN SUM(i.stock_quantity) <= MAX(i.reorder_level) THEN 'LOW STOCK'
        ELSE 'OK'
    END AS stock_status
FROM Medicine m
LEFT JOIN Inventory i ON m.medicine_id = i.medicine_id AND i.expiry_date > CURDATE()
GROUP BY m.medicine_id, m.medicine_name, m.generic_name
HAVING SUM(i.stock_quantity) <= MAX(i.reorder_level) OR SUM(i.stock_quantity) IS NULL;

-- View: Expiring medicines (within 30 days)
CREATE OR REPLACE VIEW vw_expiring_soon AS
SELECT
    m.medicine_name,
    m.generic_name,
    i.batch_number,
    i.stock_quantity,
    i.expiry_date,
    DATEDIFF(i.expiry_date, CURDATE()) AS days_remaining
FROM Inventory i
JOIN Medicine m ON i.medicine_id = m.medicine_id
WHERE i.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
  AND i.stock_quantity > 0
ORDER BY i.expiry_date;

-- View: Department heads (unary relationship)
CREATE OR REPLACE VIEW vw_department_heads AS
SELECT
    d.department_id,
    d.dept_name,
    CONCAT(p.first_name, ' ', p.last_name) AS head_name,
    doc.license_number,
    doc.years_experience
FROM Department d
JOIN Doctor doc ON d.department_id = doc.department_id AND doc.is_department_head = TRUE
JOIN Person p ON doc.doctor_id = p.person_id;

-- View: Revenue summary by month
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT
    YEAR(bill_date) AS year,
    MONTH(bill_date) AS month,
    MONTHNAME(bill_date) AS month_name,
    COUNT(*) AS total_bills,
    SUM(final_amount) AS total_revenue,
    SUM(CASE WHEN status = 'Paid' THEN final_amount ELSE 0 END) AS collected_amount,
    SUM(CASE WHEN status IN ('Pending', 'Partial') THEN final_amount ELSE 0 END) AS pending_amount
FROM Bill
WHERE status != 'Cancelled'
GROUP BY YEAR(bill_date), MONTH(bill_date), MONTHNAME(bill_date)
ORDER BY year DESC, month DESC;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_appointment_date ON Appointment(appointment_date);
CREATE INDEX idx_appointment_status ON Appointment(status);
CREATE INDEX idx_appointment_doctor ON Appointment(doctor_id, appointment_date);
CREATE INDEX idx_patient_active ON Patient(is_active);
CREATE INDEX idx_bed_status ON Bed(status);
CREATE INDEX idx_inventory_expiry ON Inventory(expiry_date);
CREATE INDEX idx_inventory_stock ON Inventory(stock_quantity);
CREATE INDEX idx_bill_date ON Bill(bill_date);
CREATE INDEX idx_bill_status ON Bill(status);
CREATE INDEX idx_dispensing_date ON Dispensing(dispensing_date);
CREATE INDEX idx_audit_created ON AuditLog(created_at);
CREATE INDEX idx_person_nic ON Person(nic);
CREATE INDEX idx_person_email ON Person(email);
CREATE INDEX idx_user_username ON UserAccount(username);

-- ============================================================
-- INITIAL DATA
-- ============================================================

-- Insert default departments
INSERT INTO Department (dept_name, description, location) VALUES
('Administration', 'Hospital administrative offices', 'Block A - Floor 3'),
('Cardiology', 'Heart and cardiovascular treatments', 'Block B - Floor 2'),
('Neurology', 'Brain and nervous system treatments', 'Block B - Floor 3'),
('Pediatrics', 'Child healthcare services', 'Block C - Floor 1'),
('Emergency', '24/7 emergency services', 'Block A - Ground Floor'),
('Pharmacy', 'Medicine dispensing and management', 'Block A - Ground Floor'),
('Laboratory', 'Diagnostic testing services', 'Block B - Ground Floor'),
('Radiology', 'Medical imaging services', 'Block B - Ground Floor'),
('Surgery', 'Surgical procedures', 'Block D - Floor 2'),
('General Medicine', 'General healthcare services', 'Block C - Floor 2');

-- Insert service types
INSERT INTO ServiceType (service_name, service_category, base_price) VALUES
('General Consultation', 'Consultation', 1500.00),
('Specialist Consultation', 'Consultation', 2500.00),
('Emergency Consultation', 'Consultation', 3500.00),
('Follow-up Visit', 'Consultation', 800.00),
('Blood Test - CBC', 'Test', 500.00),
('Blood Test - Lipid Profile', 'Test', 1200.00),
('Blood Test - Liver Function', 'Test', 1500.00),
('X-Ray', 'Test', 1000.00),
('CT Scan', 'Test', 8000.00),
('MRI Scan', 'Test', 15000.00),
('Ultrasound', 'Test', 2500.00),
('ECG', 'Test', 800.00),
('General Ward - Per Day', 'Room', 3000.00),
('ICU - Per Day', 'Room', 15000.00),
('CCU - Per Day', 'Room', 12000.00),
('Minor Procedure', 'Procedure', 5000.00),
('Major Surgery', 'Procedure', 50000.00),
('Physiotherapy Session', 'Procedure', 2000.00);

-- Insert medicine categories
INSERT INTO MedicineCategory (category_name) VALUES
('Analgesics'),
('Antibiotics'),
('Antivirals'),
('Antihypertensives'),
('Antidiabetics'),
('Cardiovascular'),
('Respiratory'),
('Gastrointestinal'),
('Neurological'),
('Dermatological'),
('Vitamins & Supplements'),
('Emergency Medicines');

-- ============================================================
-- END OF SCHEMA
-- ============================================================
