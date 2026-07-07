-- ============================================================
-- DISABLE SAFE MODE
-- ============================================================
SET SQL_SAFE_UPDATES = 0;

-- ============================================================
-- CLEAR EXISTING DATA FIRST
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM Appointment;
DELETE FROM Prescription;
DELETE FROM MedicalRecord;
DELETE FROM Dispensing;
DELETE FROM BillItem;
DELETE FROM Bill;
DELETE FROM Payment;
DELETE FROM Inventory;
DELETE FROM Medicine;
DELETE FROM MedicineCategory;
DELETE FROM DoctorSchedule;
DELETE FROM Allergy;
DELETE FROM MedicalHistory;
DELETE FROM BedAssignment;
DELETE FROM Bed;
DELETE FROM Ward;
DELETE FROM Patient;
DELETE FROM UserAccount;
DELETE FROM Admin;
DELETE FROM Doctor;
DELETE FROM Pharmacist;
DELETE FROM Receptionist;
DELETE FROM Staff;
DELETE FROM Person;
DELETE FROM Department;
DELETE FROM ServiceType;

SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment counters
ALTER TABLE Person AUTO_INCREMENT = 1;
ALTER TABLE Staff AUTO_INCREMENT = 1;
ALTER TABLE Patient AUTO_INCREMENT = 11;
ALTER TABLE Appointment AUTO_INCREMENT = 1;
ALTER TABLE Department AUTO_INCREMENT = 1;
ALTER TABLE Ward AUTO_INCREMENT = 1;
ALTER TABLE Bed AUTO_INCREMENT = 1;
ALTER TABLE Medicine AUTO_INCREMENT = 1;
ALTER TABLE Inventory AUTO_INCREMENT = 1;
ALTER TABLE MedicalRecord AUTO_INCREMENT = 1;
ALTER TABLE Prescription AUTO_INCREMENT = 1;

SELECT '✅ Existing data cleared' AS Status;

USE hms;

-- ============================================================
-- STEP 1: DEPARTMENTS
-- ============================================================
INSERT INTO Department (department_id, dept_name, description, location) VALUES
(1, 'Administration', 'Hospital administrative offices', 'Block A - Floor 3'),
(2, 'Cardiology', 'Heart and cardiovascular treatments', 'Block B - Floor 2'),
(3, 'Neurology', 'Brain and nervous system treatments', 'Block B - Floor 3'),
(4, 'Pediatrics', 'Child healthcare services', 'Block C - Floor 1'),
(5, 'Emergency', '24/7 emergency services', 'Block A - Ground Floor'),
(6, 'Pharmacy', 'Medicine dispensing and management', 'Block A - Ground Floor'),
(7, 'Laboratory', 'Diagnostic testing services', 'Block B - Ground Floor'),
(8, 'Radiology', 'Medical imaging services', 'Block B - Ground Floor'),
(9, 'Surgery', 'Surgical procedures', 'Block D - Floor 2'),
(10, 'General Medicine', 'General healthcare services', 'Block C - Floor 2');

-- ============================================================
-- STEP 2: SERVICE TYPES
-- ============================================================
INSERT INTO ServiceType (service_id, service_name, service_category, base_price) VALUES
(1, 'General Consultation', 'Consultation', 1500.00),
(2, 'Specialist Consultation', 'Consultation', 2500.00),
(3, 'Emergency Consultation', 'Consultation', 3500.00),
(4, 'Follow-up Visit', 'Consultation', 800.00),
(5, 'Blood Test - CBC', 'Test', 500.00),
(6, 'Blood Test - Lipid Profile', 'Test', 1200.00),
(7, 'Blood Test - Liver Function', 'Test', 1500.00),
(8, 'X-Ray', 'Test', 1000.00),
(9, 'CT Scan', 'Test', 8000.00),
(10, 'MRI Scan', 'Test', 15000.00),
(11, 'Ultrasound', 'Test', 2500.00),
(12, 'ECG', 'Test', 800.00),
(13, 'General Ward - Per Day', 'Room', 3000.00),
(14, 'ICU - Per Day', 'Room', 15000.00),
(15, 'CCU - Per Day', 'Room', 12000.00),
(16, 'Minor Procedure', 'Procedure', 5000.00),
(17, 'Major Surgery', 'Procedure', 50000.00),
(18, 'Physiotherapy Session', 'Procedure', 2000.00);

-- ============================================================
-- STEP 3: MEDICINE CATEGORIES
-- ============================================================
INSERT INTO MedicineCategory (category_id, category_name) VALUES
(1, 'Analgesics'),
(2, 'Antibiotics'),
(3, 'Antivirals'),
(4, 'Antihypertensives'),
(5, 'Antidiabetics'),
(6, 'Cardiovascular'),
(7, 'Respiratory'),
(8, 'Gastrointestinal'),
(9, 'Neurological'),
(10, 'Dermatological'),
(11, 'Vitamins & Supplements'),
(12, 'Emergency Medicines');

-- ============================================================
-- STEP 4: PERSONS
-- ============================================================
INSERT INTO Person (person_id, first_name, last_name, nic, email, phone, address, date_of_birth, gender) VALUES
(1, 'Admin', 'User', '200012345678', 'admin@hms.com', '0112345678', '123 Main St, Colombo', '1990-05-15', 'Male'),
(2, 'John', 'Smith', '198512345678', 'john.smith@hms.com', '0112345679', '456 Park Rd, Colombo', '1985-03-20', 'Male'),
(3, 'Sarah', 'Johnson', '198823456789', 'sarah.johnson@hms.com', '0112345680', '789 Lake Ave, Kandy', '1988-07-12', 'Female'),
(4, 'Michael', 'Perera', '199034567890', 'michael.perera@hms.com', '0112345681', '321 Hill St, Galle', '1990-11-08', 'Male'),
(5, 'Emily', 'Fernando', '198745678901', 'emily.fernando@hms.com', '0112345682', '654 Beach Rd, Negombo', '1987-02-28', 'Female'),
(6, 'David', 'Silva', '198256789012', 'david.silva@hms.com', '0112345683', '987 River Rd, Jaffna', '1982-09-15', 'Male'),
(7, 'Lisa', 'Rajapakse', '199267890123', 'lisa.rajapakse@hms.com', '0112345684', '147 Temple Rd, Kandy', '1992-04-22', 'Female'),
(8, 'James', 'Wickramasinghe', '198978901234', 'james.wick@hms.com', '0112345685', '258 Fort Rd, Galle', '1989-12-05', 'Male'),
(9, 'Mary', 'Gunawardena', '199589012345', 'mary.gunawardena@hms.com', '0112345686', '369 Main St, Colombo', '1995-06-18', 'Female'),
(10, 'Robert', 'Bandara', '199390123456', 'robert.bandara@hms.com', '0112345687', '741 Lake Rd, Kandy', '1993-08-30', 'Male'),
(11, 'Kasun', 'Rathnayake', '199512345678', 'kasun.r@email.com', '0771234567', '12/5 Flower Rd, Colombo 7', '1995-03-15', 'Male'),
(12, 'Nimali', 'Gunasekara', '199823456789', 'nimali.g@email.com', '0712345678', '45/2 Temple Rd, Kandy', '1998-07-22', 'Female'),
(13, 'Saman', 'Fernando', '198534567890', 'saman.f@email.com', '0763456789', '78/9 Lake View, Galle', '1985-11-30', 'Male'),
(14, 'Priya', 'Sharma', '199245678901', 'priya.s@email.com', '0724567890', '23/4 Hill St, Nuwara Eliya', '1992-05-08', 'Female'),
(15, 'Ajith', 'Perera', '198856789012', 'ajith.p@email.com', '0775678901', '56/7 Beach Rd, Negombo', '1988-09-12', 'Male'),
(16, 'Chandani', 'Silva', '199067890123', 'chandani.s@email.com', '0716789012', '89/1 Fort Rd, Jaffna', '1990-02-25', 'Female'),
(17, 'Roshan', 'Kumar', '198778901234', 'roshan.k@email.com', '0767890123', '34/6 Main St, Matara', '1987-12-18', 'Male'),
(18, 'Deepika', 'Raj', '199489012345', 'deepika.r@email.com', '0728901234', '67/8 Park Rd, Anuradhapura', '1994-04-03', 'Female'),
(19, 'Suresh', 'Babu', '198290123456', 'suresh.b@email.com', '0779012345', '90/3 River Rd, Ratnapura', '1982-08-27', 'Male'),
(20, 'Meena', 'Das', '199601234567', 'meena.d@email.com', '0710123456', '12/9 Garden Rd, Batticaloa', '1996-01-14', 'Female');

-- ============================================================
-- STEP 5: STAFF
-- ============================================================
INSERT INTO Staff (staff_id, employee_code, hire_date, salary, status) VALUES
(1, 'EMP-001', '2020-01-15', 85000.00, 'Active'),
(2, 'EMP-002', '2018-03-20', 150000.00, 'Active'),
(3, 'EMP-003', '2019-07-12', 145000.00, 'Active'),
(4, 'EMP-004', '2020-11-08', 140000.00, 'Active'),
(5, 'EMP-005', '2017-02-28', 160000.00, 'Active'),
(6, 'EMP-006', '2021-09-15', 155000.00, 'Active'),
(7, 'EMP-007', '2021-04-22', 75000.00, 'Active'),
(8, 'EMP-008', '2020-12-05', 72000.00, 'Active'),
(9, 'EMP-009', '2022-06-18', 55000.00, 'Active'),
(10, 'EMP-010', '2022-08-30', 52000.00, 'Active');

-- ============================================================
-- STEP 6: ADMIN, DOCTOR, PHARMACIST, RECEPTIONIST
-- ============================================================
INSERT INTO Admin (admin_id, admin_level, access_level) VALUES (1, 'Super', 5);

INSERT INTO Doctor (doctor_id, specialization, license_number, years_experience, consultation_fee, is_department_head, department_id) VALUES
(2, 'Cardiology', 'MD-CARD-001', 15, 3500.00, TRUE, 2),
(3, 'Neurology', 'MD-NEUR-002', 12, 3200.00, FALSE, 3),
(4, 'Pediatrics', 'MD-PED-003', 10, 2800.00, TRUE, 4),
(5, 'General Medicine', 'MD-GM-004', 18, 3000.00, FALSE, 10),
(6, 'Emergency Medicine', 'MD-EM-005', 8, 3500.00, TRUE, 5);

INSERT INTO Pharmacist (pharmacist_id, license_number, pharmacy_license, specialization) VALUES
(7, 'PHARM-001', 'PH-LIC-001', 'Clinical'),
(8, 'PHARM-002', 'PH-LIC-002', 'General');

INSERT INTO Receptionist (receptionist_id, shift, counter_number) VALUES
(9, 'Morning', 1),
(10, 'Afternoon', 2);

-- ============================================================
-- STEP 7: PATIENT SUBCLASS
-- ============================================================
INSERT INTO Patient (patient_id, patient_code, registration_date, blood_group, height_cm, weight_kg, emergency_contact_name, emergency_contact_phone, emergency_contact_relation) VALUES
(11, 'PAT-000001', '2024-01-10', 'A+', 175.0, 72.5, 'Sunil Rathnayake', '0771111222', 'Father'),
(12, 'PAT-000002', '2024-01-15', 'B+', 162.0, 58.0, 'Mahinda Gunasekara', '0712222333', 'Husband'),
(13, 'PAT-000003', '2024-02-01', 'O+', 180.0, 85.0, 'Lalini Fernando', '0763333444', 'Wife'),
(14, 'PAT-000004', '2024-02-10', 'AB+', 155.0, 52.0, 'Rajesh Sharma', '0724444555', 'Husband'),
(15, 'PAT-000005', '2024-02-20', 'A-', 178.0, 78.0, 'Kamala Perera', '0775555666', 'Mother'),
(16, 'PAT-000006', '2024-03-01', 'B-', 168.0, 65.0, 'Pradeep Silva', '0716666777', 'Husband'),
(17, 'PAT-000007', '2024-03-10', 'O-', 172.0, 70.0, 'Nirmal Kumar', '0767777888', 'Brother'),
(18, 'PAT-000008', '2024-03-15', 'AB-', 160.0, 55.0, 'Saman Raj', '0728888999', 'Father'),
(19, 'PAT-000009', '2024-03-20', 'A+', 182.0, 88.0, 'Geetha Babu', '0779999000', 'Wife'),
(20, 'PAT-000010', '2024-03-25', 'O+', 165.0, 60.0, 'Anil Das', '0710000111', 'Husband');

-- ============================================================
-- STEP 8: MEDICAL HISTORY
-- ============================================================
INSERT INTO MedicalHistory (patient_id, condition_name, diagnosis_date, severity, status, notes) VALUES
(11, 'Hypertension', '2024-01-10', 'Moderate', 'Chronic', 'On medication'),
(11, 'Type 2 Diabetes', '2024-01-10', 'Mild', 'Chronic', 'Controlled with diet'),
(12, 'Asthma', '2024-01-15', 'Moderate', 'Chronic', 'Uses inhaler'),
(13, 'Heart Disease', '2024-02-01', 'Severe', 'Active', 'Post-bypass surgery'),
(14, 'Thyroid Disorder', '2024-02-10', 'Mild', 'Chronic', 'On medication'),
(15, 'Arthritis', '2024-02-20', 'Moderate', 'Chronic', 'Physiotherapy recommended'),
(17, 'Migraine', '2024-03-10', 'Moderate', 'Active', 'Trigger avoidance'),
(19, 'Sleep Apnea', '2024-03-20', 'Severe', 'Active', 'Uses CPAP machine');

-- ============================================================
-- STEP 9: ALLERGIES
-- ============================================================
INSERT INTO Allergy (patient_id, allergen_name, reaction_type, severity, identified_date) VALUES
(11, 'Penicillin', 'Skin rash', 'Severe', '2024-01-10'),
(12, 'Peanuts', 'Anaphylaxis', 'Life-threatening', '2024-01-15'),
(13, 'Latex', 'Contact dermatitis', 'Mild', '2024-02-01'),
(15, 'Aspirin', 'Stomach upset', 'Moderate', '2024-02-20'),
(17, 'Shellfish', 'Hives', 'Moderate', '2024-03-10'),
(19, 'Dust mites', 'Sneezing', 'Mild', '2024-03-20');

-- ============================================================
-- STEP 10: WARDS
-- ============================================================
INSERT INTO Ward (ward_id, ward_name, ward_type, floor_number, total_beds, available_beds, department_id, phone) VALUES
(1, 'General Ward A', 'General', 1, 20, 20, 10, '0112345700'),
(2, 'General Ward B', 'General', 2, 15, 15, 10, '0112345701'),
(3, 'ICU Main', 'ICU', 3, 10, 10, 2, '0112345702'),
(4, 'CCU', 'CCU', 3, 8, 8, 2, '0112345703'),
(5, 'Pediatric Ward', 'Pediatric', 2, 12, 12, 4, '0112345704'),
(6, 'Maternity Ward', 'Maternity', 1, 10, 10, 4, '0112345705'),
(7, 'Surgical Ward', 'Surgical', 4, 15, 15, 9, '0112345706'),
(8, 'Emergency Ward', 'Emergency', 1, 8, 8, 5, '0112345707');

-- ============================================================
-- STEP 11: BEDS
-- ============================================================
INSERT INTO Bed (ward_id, bed_number, bed_type, status) VALUES
(1, 'GW-A-01', 'General', 'Available'),
(1, 'GW-A-02', 'General', 'Available'),
(1, 'GW-A-03', 'General', 'Available'),
(1, 'GW-A-04', 'General', 'Available'),
(1, 'GW-A-05', 'General', 'Available'),
(3, 'ICU-01', 'ICU', 'Available'),
(3, 'ICU-02', 'ICU', 'Available'),
(3, 'ICU-03', 'ICU', 'Available'),
(5, 'PED-01', 'Pediatric', 'Available'),
(5, 'PED-02', 'Pediatric', 'Available'),
(5, 'PED-03', 'Pediatric', 'Available');

-- ============================================================
-- STEP 12: DOCTOR SCHEDULES
-- ============================================================
INSERT INTO DoctorSchedule (doctor_id, day_of_week, start_time, end_time, is_available, max_appointments) VALUES
(2, 'Monday', '09:00:00', '17:00:00', TRUE, 20),
(2, 'Wednesday', '09:00:00', '17:00:00', TRUE, 20),
(2, 'Friday', '09:00:00', '17:00:00', TRUE, 20),
(3, 'Tuesday', '09:00:00', '17:00:00', TRUE, 20),
(3, 'Thursday', '09:00:00', '17:00:00', TRUE, 20),
(4, 'Monday', '08:00:00', '16:00:00', TRUE, 25),
(4, 'Wednesday', '08:00:00', '16:00:00', TRUE, 25),
(4, 'Friday', '08:00:00', '16:00:00', TRUE, 25),
(5, 'Tuesday', '09:00:00', '17:00:00', TRUE, 20),
(5, 'Thursday', '09:00:00', '17:00:00', TRUE, 20),
(5, 'Saturday', '09:00:00', '13:00:00', TRUE, 15),
(6, 'Monday', '07:00:00', '19:00:00', TRUE, 30),
(6, 'Tuesday', '07:00:00', '19:00:00', TRUE, 30),
(6, 'Wednesday', '07:00:00', '19:00:00', TRUE, 30),
(6, 'Thursday', '07:00:00', '19:00:00', TRUE, 30),
(6, 'Friday', '07:00:00', '19:00:00', TRUE, 30);

-- ============================================================
-- STEP 13: APPOINTMENTS
-- ============================================================
INSERT INTO Appointment (patient_id, doctor_id, appointment_date, appointment_time, appointment_type, status, symptoms, created_by) VALUES
(11, 2, '2026-04-27', '09:00:00', 'Consultation', 'Completed', 'Chest pain', 9),
(13, 2, '2026-04-27', '10:00:00', 'Consultation', 'Pending', 'Heart palpitations', 9),
(11, 2, '2026-04-29', '09:00:00', 'Follow-up', 'Confirmed', 'Follow-up', 9),
(19, 2, '2026-04-29', '14:30:00', 'Follow-up', 'Pending', 'Cardiac follow-up', 9),
(12, 3, '2026-04-28', '09:30:00', 'Follow-up', 'In Progress', 'Neurological checkup', 9),
(20, 3, '2026-04-30', '15:00:00', 'Consultation', 'Confirmed', 'Neurological symptoms', 10),
(14, 4, '2026-04-27', '10:30:00', 'Checkup', 'Confirmed', 'Thyroid check', 10),
(16, 4, '2026-04-29', '09:30:00', 'Consultation', 'Pending', 'General checkup', 9),
(15, 5, '2026-04-28', '11:00:00', 'Consultation', 'Pending', 'Joint pain', 10),
(18, 5, '2026-04-30', '14:00:00', 'Consultation', 'Confirmed', 'Routine checkup', 9),
(17, 6, '2026-04-28', '10:00:00', 'Emergency', 'Pending', 'Severe headache', 10);

-- ============================================================
-- STEP 14: MEDICINES
-- ============================================================
INSERT INTO Medicine (medicine_id, medicine_name, generic_name, category_id, manufacturer, dosage_form, strength, unit_price, requires_prescription) VALUES
(1, 'Panadol', 'Paracetamol', 1, 'GSK', 'Tablet', '500mg', 15.00, FALSE),
(2, 'Disprin', 'Aspirin', 1, 'Reckitt Benckiser', 'Tablet', '75mg', 25.00, FALSE),
(3, 'Tramadol', 'Tramadol HCl', 1, 'Pfizer', 'Capsule', '50mg', 85.00, TRUE),
(4, 'Amoxil', 'Amoxicillin', 2, 'GSK', 'Capsule', '500mg', 45.00, TRUE),
(5, 'Augmentin', 'Amoxicillin + Clavulanate', 2, 'GSK', 'Tablet', '625mg', 120.00, TRUE),
(6, 'Ciprofloxacin', 'Ciprofloxacin', 2, 'Bayer', 'Tablet', '500mg', 95.00, TRUE),
(7, 'Tenormin', 'Atenolol', 4, 'AstraZeneca', 'Tablet', '50mg', 35.00, TRUE),
(8, 'Norvasc', 'Amlodipine', 4, 'Pfizer', 'Tablet', '5mg', 55.00, TRUE),
(9, 'Cozaar', 'Losartan', 4, 'Merck', 'Tablet', '50mg', 75.00, TRUE),
(10, 'Diabex', 'Metformin', 5, 'Merck', 'Tablet', '500mg', 25.00, TRUE),
(11, 'Gliclazide', 'Gliclazide', 5, 'Servier', 'Tablet', '80mg', 45.00, TRUE),
(12, 'Crestor', 'Rosuvastatin', 6, 'AstraZeneca', 'Tablet', '10mg', 150.00, TRUE),
(13, 'Lipitor', 'Atorvastatin', 6, 'Pfizer', 'Tablet', '20mg', 180.00, TRUE),
(14, 'Ventolin', 'Salbutamol', 7, 'GSK', 'Inhaler', '100mcg', 450.00, TRUE),
(15, 'Flixotide', 'Fluticasone', 7, 'GSK', 'Inhaler', '250mcg', 850.00, TRUE),
(16, 'Omeprazole', 'Omeprazole', 8, 'AstraZeneca', 'Capsule', '20mg', 35.00, TRUE),
(17, 'Pantoprazole', 'Pantoprazole', 8, 'Takeda', 'Tablet', '40mg', 65.00, TRUE);

-- ============================================================
-- STEP 15: INVENTORY
-- ============================================================
INSERT INTO Inventory (medicine_id, batch_number, stock_quantity, reorder_level, expiry_date, supplier_name, unit_cost, location) VALUES
(1, 'PAN-2024-001', 500, 100, DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 'Pharma Distributors Ltd', 10.00, 'Shelf A1'),
(1, 'PAN-2024-002', 300, 100, DATE_ADD(CURDATE(), INTERVAL 24 MONTH), 'Pharma Distributors Ltd', 10.00, 'Shelf A1'),
(2, 'DIS-2024-001', 200, 50, DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'Medi Supplies', 18.00, 'Shelf A1'),
(3, 'TRA-2024-001', 100, 30, DATE_ADD(CURDATE(), INTERVAL 15 MONTH), 'Pharma Distributors Ltd', 60.00, 'Shelf A2'),
(4, 'AMX-2024-001', 250, 50, DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'GSK Direct', 35.00, 'Shelf B1'),
(5, 'AUG-2024-001', 150, 40, DATE_ADD(CURDATE(), INTERVAL 8 MONTH), 'GSK Direct', 90.00, 'Shelf B1'),
(6, 'CIP-2024-001', 100, 30, DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 'Bayer Pharma', 70.00, 'Shelf B2'),
(7, 'TEN-2024-001', 80, 25, DATE_ADD(CURDATE(), INTERVAL 20 MONTH), 'AstraZeneca', 28.00, 'Shelf C1'),
(8, 'NOR-2024-001', 120, 30, DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 'Pfizer Direct', 45.00, 'Shelf C1'),
(9, 'COZ-2024-001', 90, 25, DATE_ADD(CURDATE(), INTERVAL 16 MONTH), 'Merck Pharma', 60.00, 'Shelf C2'),
(10, 'DIA-2024-001', 300, 100, DATE_ADD(CURDATE(), INTERVAL 24 MONTH), 'Merck Pharma', 18.00, 'Shelf D1'),
(11, 'GLI-2024-001', 150, 40, DATE_ADD(CURDATE(), INTERVAL 14 MONTH), 'Servier Labs', 35.00, 'Shelf D1'),
(12, 'CRE-2024-001', 60, 20, DATE_ADD(CURDATE(), INTERVAL 22 MONTH), 'AstraZeneca', 120.00, 'Shelf D2'),
(13, 'LIP-2024-001', 50, 20, DATE_ADD(CURDATE(), INTERVAL 20 MONTH), 'Pfizer Direct', 150.00, 'Shelf D2'),
(14, 'VEN-2024-001', 40, 15, DATE_ADD(CURDATE(), INTERVAL 12 MONTH), 'GSK Direct', 380.00, 'Shelf E1'),
(15, 'FLI-2024-001', 25, 10, DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 'GSK Direct', 700.00, 'Shelf E1'),
(16, 'OME-2024-001', 200, 50, DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 'AstraZeneca', 28.00, 'Shelf E2'),
(17, 'PAN-2024-003', 100, 30, DATE_ADD(CURDATE(), INTERVAL 15 MONTH), 'Takeda Pharma', 50.00, 'Shelf E2');

-- ============================================================
-- STEP 16: MEDICAL RECORDS (MUST BE BEFORE PRESCRIPTIONS!)
-- ============================================================
INSERT INTO MedicalRecord (record_id, patient_id, doctor_id, appointment_id, record_date, diagnosis, treatment_plan, follow_up_required, follow_up_date) VALUES
(1, 11, 2, 1, CURDATE(), 'Hypertension, Angina', 'Prescribed beta blockers', TRUE, DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
(2, 12, 3, 2, CURDATE(), 'Migraine with aura', 'Continue medication', TRUE, DATE_ADD(CURDATE(), INTERVAL 60 DAY)),
(3, 13, 2, 3, CURDATE(), 'Suspected arrhythmia', 'ECG ordered', TRUE, DATE_ADD(CURDATE(), INTERVAL 7 DAY));

-- ============================================================
-- STEP 17: PRESCRIPTIONS (NOW record_id 1,2,3 EXIST!)
-- ============================================================
INSERT INTO Prescription (record_id, medicine_id, dosage, frequency, duration_days, instructions, quantity_prescribed) VALUES
(1, 7, '1 tablet', 'Twice daily', 30, 'Take after meals', 60),
(1, 8, '1 tablet', 'Once daily', 30, 'Take in the morning', 30),
(1, 12, '1 tablet', 'Once daily at bedtime', 30, 'Take with food', 30),
(2, 1, '1-2 tablets', 'Every 6 hours', 14, 'Take with water', 28),
(3, 7, '1 tablet', 'Twice daily', 14, 'Take after meals', 28),
(3, 16, '1 capsule', 'Once daily', 14, 'Take before breakfast', 14);

-- ============================================================
-- STEP 18: USER ACCOUNTS
-- ============================================================
INSERT INTO UserAccount (username, password_hash, role, person_id, role_entity_id) VALUES
('admin', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Admin', 1, 1),
('doctor', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Doctor', 2, 2),
('doctor.sarah', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Doctor', 3, 3),
('doctor.michael', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Doctor', 4, 4),
('doctor.emily', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Doctor', 5, 5),
('doctor.david', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Doctor', 6, 6),
('pharmacist', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Pharmacist', 7, 7),
('pharmacist.james', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Pharmacist', 8, 8),
('receptionist', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Receptionist', 9, 9),
('receptionist.robert', '$2a$10$01ub3.Mcacpple6NyD9T8uLpVIOekcaN3rtdNy11AEoNhxyB3bsRu', 'Receptionist', 10, 10);


-- ============================================================
-- STEP 19: INSURANCE PROVIDERS
-- ============================================================
INSERT INTO InsuranceProvider (provider_id, provider_name, contact_person, phone, email, address, claim_processing_days, is_active) VALUES
(1, 'Sri Lanka Insurance', 'Mr. Perera', '0112223344', 'info@slic.lk', 'Colombo 2', 30, 1),
(2, 'Ceylinco Insurance', 'Mrs. Silva', '0112223345', 'info@ceylinco.lk', 'Colombo 3', 15, 1),
(3, 'Allianz Insurance', 'Mr. Fernando', '0112223346', 'info@allianz.lk', 'Colombo 4', 20, 1);

-- ============================================================
-- STEP 20: BILLS/INVOICES (WITH MO-M HISTORICAL DATES)
-- ============================================================
INSERT INTO Bill (bill_id, bill_number, patient_id, bill_date, total_amount, discount_amount, tax_amount, final_amount, status, generated_by, due_date, notes) VALUES
(1, 'BILL-202605-000001', 11, DATE_SUB(NOW(), INTERVAL 9 DAY), 1500.00, 0.00, 120.00, 1620.00, 'Paid', 9, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'General consultation'),
(2, 'BILL-202605-000002', 12, DATE_SUB(NOW(), INTERVAL 8 DAY), 2500.00, 0.00, 200.00, 2700.00, 'Paid', 9, DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Specialist consultation'),
(3, 'BILL-202605-000003', 13, DATE_SUB(NOW(), INTERVAL 7 DAY), 15000.00, 500.00, 1160.00, 15660.00, 'Paid', 10, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'ICU ward stay'),
(4, 'BILL-202605-000004', 14, DATE_SUB(NOW(), INTERVAL 6 DAY), 8000.00, 0.00, 640.00, 8640.00, 'Paid', 9, DATE_SUB(CURDATE(), INTERVAL 6 DAY), 'CT Scan'),
(5, 'BILL-202605-000005', 15, DATE_SUB(NOW(), INTERVAL 5 DAY), 3000.00, 100.00, 232.00, 3132.00, 'Partial', 10, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'General ward stay'),
(6, 'BILL-202605-000006', 16, DATE_SUB(NOW(), INTERVAL 4 DAY), 5000.00, 0.00, 400.00, 5400.00, 'Pending', 9, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Minor procedure'),
(7, 'BILL-202605-000007', 17, DATE_SUB(NOW(), INTERVAL 3 DAY), 2500.00, 0.00, 200.00, 2700.00, 'Paid', 10, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Specialist consultation'),
(8, 'BILL-202605-000008', 18, DATE_SUB(NOW(), INTERVAL 2 DAY), 1200.00, 0.00, 96.00, 1296.00, 'Paid', 9, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Lipid profile test'),
(9, 'BILL-202605-000009', 19, DATE_SUB(NOW(), INTERVAL 1 DAY), 15000.00, 1000.00, 1120.00, 15120.00, 'Paid', 9, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'ICU ward stay'),
(10, 'BILL-202605-000010', 20, NOW(), 3500.00, 0.00, 280.00, 3780.00, 'Pending', 10, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Emergency consultation');

-- ============================================================
-- STEP 21: BILL ITEMS
-- ============================================================
INSERT INTO BillItem (bill_id, service_id, medicine_id, description, quantity, unit_price, amount) VALUES
(1, 1, NULL, 'General Consultation', 1, 1500.00, 1500.00),
(2, 2, NULL, 'Specialist Consultation', 1, 2500.00, 2500.00),
(3, 14, NULL, 'ICU - Per Day', 1, 15000.00, 15000.00),
(4, 9, NULL, 'CT Scan', 1, 8000.00, 8000.00),
(5, 13, NULL, 'General Ward - Per Day', 1, 3000.00, 3000.00),
(6, 16, NULL, 'Minor Procedure', 1, 5000.00, 5000.00),
(7, 2, NULL, 'Specialist Consultation', 1, 2500.00, 2500.00),
(8, 6, NULL, 'Blood Test - Lipid Profile', 1, 1200.00, 1200.00),
(9, 14, NULL, 'ICU - Per Day', 1, 15000.00, 15000.00),
(10, 3, NULL, 'Emergency Consultation', 1, 3500.00, 3500.00);

-- ============================================================
-- STEP 22: PAYMENTS
-- ============================================================
INSERT INTO Payment (bill_id, payment_date, amount, payment_method, payment_reference, received_by, notes) VALUES
(1, DATE_SUB(NOW(), INTERVAL 9 DAY), 1620.00, 'Cash', NULL, 9, 'Full payment'),
(2, DATE_SUB(NOW(), INTERVAL 8 DAY), 2700.00, 'Card', 'TXN-1000234', 9, 'Full payment'),
(3, DATE_SUB(NOW(), INTERVAL 7 DAY), 15660.00, 'Online', 'TXN-1000235', 10, 'Full payment'),
(4, DATE_SUB(NOW(), INTERVAL 6 DAY), 8640.00, 'Bank Transfer', 'TXN-1000236', 9, 'Full payment'),
(5, DATE_SUB(NOW(), INTERVAL 5 DAY), 1500.00, 'Cash', NULL, 10, 'Partial payment'),
(7, DATE_SUB(NOW(), INTERVAL 3 DAY), 2700.00, 'Card', 'TXN-1000237', 10, 'Full payment'),
(8, DATE_SUB(NOW(), INTERVAL 2 DAY), 1296.00, 'Cash', NULL, 9, 'Full payment'),
(9, DATE_SUB(NOW(), INTERVAL 1 DAY), 15120.00, 'Insurance', 'CLAIM-552093', 9, 'Full claim paid');

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
SELECT '========================================' AS '';
SELECT '✅ ALL DATA INSERTED SUCCESSFULLY!' AS 'STATUS';
SELECT '========================================' AS '';

SELECT 'Record Counts:' AS '';
SELECT COUNT(*) AS Persons FROM Person
UNION ALL SELECT COUNT(*) FROM Staff
UNION ALL SELECT COUNT(*) FROM Patient
UNION ALL SELECT COUNT(*) FROM Doctor
UNION ALL SELECT COUNT(*) FROM Appointment
UNION ALL SELECT COUNT(*) FROM Medicine
UNION ALL SELECT COUNT(*) FROM Inventory
UNION ALL SELECT COUNT(*) FROM MedicalRecord
UNION ALL SELECT COUNT(*) FROM Prescription
UNION ALL SELECT COUNT(*) FROM UserAccount
UNION ALL SELECT COUNT(*) FROM InsuranceProvider
UNION ALL SELECT COUNT(*) FROM Bill
UNION ALL SELECT COUNT(*) FROM BillItem
UNION ALL SELECT COUNT(*) FROM Payment;

SET SQL_SAFE_UPDATES = 1;