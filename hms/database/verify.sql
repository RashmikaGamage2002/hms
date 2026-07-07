-- ============================================================
-- Hospital Management System - Verification Script
-- Run this AFTER seed.sql to verify all features work correctly
-- ============================================================

USE hms;

SELECT '========================================' AS '';
SELECT 'HMS VERIFICATION SCRIPT' AS 'Test Suite';
SELECT '========================================' AS '';

-- ============================================================
-- 1. VERIFY SUPERCLASS/SUBCLASS RELATIONSHIPS
-- ============================================================
SELECT '--- Test 1: Superclass/Subclass Relationships ---' AS 'Test Category';

-- Verify Person superclass has all staff and patients
SELECT 'Person table count:' AS 'Check', COUNT(*) AS 'Result' FROM Person;
SELECT 'Staff subclass count:' AS 'Check', COUNT(*) AS 'Result' FROM Staff;
SELECT 'Doctor subclass count:' AS 'Check', COUNT(*) AS 'Result' FROM Doctor;
SELECT 'Patient subclass count:' AS 'Check', COUNT(*) AS 'Result' FROM Patient;

-- Verify FK CASCADE works (should show orphan check)
SELECT 'Staff with valid Person FK:' AS 'Check', COUNT(*) AS 'Result'
FROM Staff s JOIN Person p ON s.staff_id = p.person_id;

-- ============================================================
-- 2. VERIFY WEAK ENTITIES (IDENTIFYING RELATIONSHIPS)
-- ============================================================
SELECT '--- Test 2: Weak Entity Relationships ---' AS 'Test Category';

-- MedicalRecord depends on Patient and Doctor
SELECT 'Medical Records with valid FKs:' AS 'Check', COUNT(*) AS 'Result'
FROM MedicalRecord mr
JOIN Patient p ON mr.patient_id = p.patient_id
JOIN Doctor d ON mr.doctor_id = d.doctor_id;

-- Prescription depends on MedicalRecord and Medicine
SELECT 'Prescriptions with valid FKs:' AS 'Check', COUNT(*) AS 'Result'
FROM Prescription pr
JOIN MedicalRecord mr ON pr.record_id = mr.record_id
JOIN Medicine m ON pr.medicine_id = m.medicine_id;

-- BedAssignment depends on Bed and Patient
SELECT 'Bed Assignments with valid FKs:' AS 'Check', COUNT(*) AS 'Result'
FROM BedAssignment ba
JOIN Bed b ON ba.bed_id = b.bed_id
JOIN Patient p ON ba.patient_id = p.patient_id;

-- ============================================================
-- 3. VERIFY CONSTRAINTS (CHECK, UNIQUE, FK CASCADE)
-- ============================================================
SELECT '--- Test 3: Constraint Verification ---' AS 'Test Category';

-- Test CHECK constraint: stock_quantity >= 0
SELECT 'Inventory with non-negative stock:' AS 'Check', COUNT(*) AS 'Result'
FROM Inventory WHERE stock_quantity >= 0;

-- Test UNIQUE constraint on NIC
SELECT 'Unique NIC check (should match Person count):' AS 'Check', COUNT(DISTINCT nic) AS 'Result' FROM Person;

-- Test UNIQUE constraint on Email
SELECT 'Unique Email check (should match Person count):' AS 'Check', COUNT(DISTINCT email) AS 'Result' FROM Person;

-- Test CHECK constraint: valid blood groups
SELECT 'Patients with valid blood groups:' AS 'Check', COUNT(*) AS 'Result'
FROM Patient WHERE blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR blood_group IS NULL;

-- ============================================================
-- 4. VERIFY STORED FUNCTIONS
-- ============================================================
SELECT '--- Test 4: Stored Functions ---' AS 'Test Category';

-- Test calculate_patient_age function
SELECT 'Patient Age Calculation:' AS 'Function Test';
SELECT
    p.patient_code,
    CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
    per.date_of_birth,
    calculate_patient_age(p.patient_id) AS calculated_age
FROM Patient p
JOIN Person per ON p.patient_id = per.person_id
LIMIT 5;

-- Test calculate_stay_duration function
SELECT 'Stay Duration Calculation:' AS 'Function Test';
SELECT
    p.patient_code,
    CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
    calculate_stay_duration(p.patient_id) AS stay_days
FROM Patient p
JOIN Person per ON p.patient_id = per.person_id
LIMIT 5;

-- Test get_medicine_stock function
SELECT 'Medicine Stock Function:' AS 'Function Test';
SELECT
    m.medicine_name,
    get_medicine_stock(m.medicine_id) AS current_stock
FROM Medicine m
LIMIT 5;

-- Test is_low_stock function
SELECT 'Low Stock Detection:' AS 'Function Test';
SELECT
    m.medicine_name,
    get_medicine_stock(m.medicine_id) AS stock,
    is_low_stock(m.medicine_id) AS is_low
FROM Medicine m
WHERE is_low_stock(m.medicine_id) = TRUE
LIMIT 5;

-- ============================================================
-- 5. VERIFY STORED PROCEDURES
-- ============================================================
SELECT '--- Test 5: Stored Procedures ---' AS 'Test Category';

-- Test sp_get_low_stock_medicines
SELECT 'Low Stock Medicines Procedure:' AS 'Procedure Test';
CALL sp_get_low_stock_medicines();

-- Test sp_get_expiring_medicines
SELECT 'Expiring Medicines Procedure:' AS 'Procedure Test';
CALL sp_get_expiring_medicines(30);

-- Test sp_patient_load_report
SELECT 'Patient Load Report Procedure:' AS 'Procedure Test';
CALL sp_patient_load_report();

-- ============================================================
-- 6. VERIFY TRIGGERS
-- ============================================================
SELECT '--- Test 6: Trigger Verification ---' AS 'Test Category';

-- Record initial stock
SELECT 'Initial stock for Medicine ID 1:' AS 'Before Trigger';
SELECT inventory_id, batch_number, stock_quantity
FROM Inventory WHERE medicine_id = 1;

-- Test dispensing trigger (auto-deduct inventory)
SELECT 'Testing dispensing trigger...' AS 'Action';

-- Create a test dispensing record
INSERT INTO Dispensing (prescription_id, medicine_id, pharmacist_id, inventory_id, quantity_dispensed, batch_number)
VALUES (1, 1, 7, 1, 5, 'PAN-2024-001');

-- Verify stock was deducted
SELECT 'Stock after dispensing (should be reduced by 5):' AS 'After Trigger';
SELECT inventory_id, batch_number, stock_quantity
FROM Inventory WHERE medicine_id = 1;

-- ============================================================
-- 7. VERIFY VIEWS
-- ============================================================
SELECT '--- Test 7: View Verification ---' AS 'Test Category';

-- Test vw_active_patients view
SELECT 'Active Patients View:' AS 'View Test';
SELECT * FROM vw_active_patients LIMIT 5;

-- Test vw_todays_appointments view
SELECT "Today's Appointments View:" AS 'View Test';
SELECT * FROM vw_todays_appointments;

-- Test vw_low_stock view
SELECT 'Low Stock View:' AS 'View Test';
SELECT * FROM vw_low_stock LIMIT 5;

-- Test vw_expiring_soon view
SELECT 'Expiring Soon View:' AS 'View Test';
SELECT * FROM vw_expiring_soon LIMIT 5;

-- Test vw_department_heads view (unary relationship)
SELECT 'Department Heads View:' AS 'View Test';
SELECT * FROM vw_department_heads;

-- Test vw_monthly_revenue view
SELECT 'Monthly Revenue View:' AS 'View Test';
SELECT * FROM vw_monthly_revenue LIMIT 6;

-- ============================================================
-- 8. VERIFY COMPLEX QUERIES (JOINs, CTEs, Window Functions)
-- ============================================================
SELECT '--- Test 8: Complex Query Verification ---' AS 'Test Category';

-- Test INNER JOIN
SELECT 'Inner Join - Patients with Appointments:' AS 'Query Test';
SELECT
    p.patient_code,
    CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
    COUNT(a.appointment_id) AS appointment_count
FROM Patient p
INNER JOIN Appointment a ON p.patient_id = a.patient_id
INNER JOIN Person per ON p.patient_id = per.person_id
GROUP BY p.patient_id
ORDER BY appointment_count DESC
LIMIT 5;

-- Test LEFT JOIN
SELECT 'Left Join - All Patients with Medical History:' AS 'Query Test';
SELECT
    p.patient_code,
    CONCAT(per.first_name, ' ', per.last_name) AS patient_name,
    COUNT(mh.history_id) AS medical_conditions
FROM Patient p
LEFT JOIN MedicalHistory mh ON p.patient_id = mh.patient_id
LEFT JOIN Person per ON p.patient_id = per.person_id
GROUP BY p.patient_id
LIMIT 5;

-- Test CTE with hierarchical reporting
SELECT 'CTE - Revenue with Running Total:' AS 'Query Test';
WITH DailyRevenue AS (
    SELECT
        DATE(bill_date) AS report_date,
        COUNT(*) AS bill_count,
        SUM(final_amount) AS daily_total
    FROM Bill
    GROUP BY DATE(bill_date)
)
SELECT
    report_date,
    bill_count,
    daily_total,
    SUM(daily_total) OVER (ORDER BY report_date) AS cumulative_revenue
FROM DailyRevenue
ORDER BY report_date
LIMIT 7;

---- Test Window Functions
SELECT 'Window Function - Ranked Doctors by Appointments:' AS 'Query Test';
SELECT
    doctor_id,
    specialization,
    COUNT(*) AS appointment_count,
    RANK() OVER (ORDER BY COUNT(*) DESC) AS `rank`   -- ✅ Fixed with backticks
FROM Appointment
JOIN Doctor USING (doctor_id)
GROUP BY doctor_id, specialization
ORDER BY `rank`
LIMIT 5;
-- Test UNION (active/archived records)
SELECT 'UNION - All Appointments by Status:' AS 'Query Test';
SELECT appointment_id, patient_id, doctor_id, appointment_date, 'Current' AS source FROM Appointment WHERE status != 'Cancelled'
UNION ALL
SELECT appointment_id, patient_id, doctor_id, appointment_date, 'Cancelled' AS source FROM Appointment WHERE status = 'Cancelled'
ORDER BY appointment_date DESC
LIMIT 10;

-- ============================================================
-- 9. VERIFY RBAC AND USER ACCOUNTS
-- ============================================================
SELECT '--- Test 9: RBAC Verification ---' AS 'Test Category';

SELECT 'User Accounts by Role:' AS 'Check';
SELECT role, COUNT(*) AS count FROM UserAccount GROUP BY role;

SELECT 'Active Users:' AS 'Check', COUNT(*) AS 'Result' FROM UserAccount WHERE is_active = TRUE;

-- ============================================================
-- 10. VERIFY INVENTORY AND PHARMACY LOGIC
-- ============================================================
SELECT '--- Test 10: Inventory Logic ---' AS 'Test Category';

-- Verify FEFO (First Expired First Out) logic
SELECT 'Inventory sorted by expiry (FEFO):' AS 'Check';
SELECT
    m.medicine_name,
    i.batch_number,
    i.stock_quantity,
    i.expiry_date,
    DATEDIFF(i.expiry_date, CURDATE()) AS days_remaining
FROM Inventory i
JOIN Medicine m ON i.medicine_id = m.medicine_id
WHERE i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
ORDER BY i.expiry_date ASC
LIMIT 10;

-- ============================================================
-- SUMMARY
-- ============================================================
SELECT '========================================' AS '';
SELECT 'VERIFICATION COMPLETE' AS 'Status';
SELECT '========================================' AS '';
SELECT 'Check the output above for any errors.' AS 'Note';
SELECT 'If all tests completed without errors, the HMS is correctly configured.' AS 'Note';
