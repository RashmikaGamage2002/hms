import { query, getConnection } from '../config/database.js';

// Generate invoice using stored procedure
export const generateInvoice = async (req, res) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const { patientId, items, generatedBy } = req.body;

    if (!patientId || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and items are required'
      });
    }

    // Generate bill number using function
    const billNumberResult = await query(`SELECT generate_bill_number() AS bill_number`);
    const billNumber = billNumberResult[0].bill_number;

    // Calculate totals
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unitPrice;
    }

    const discountAmount = req.body.discount || 0;
    const taxAmount = totalAmount * 0.08; // 8% tax
    const finalAmount = totalAmount - discountAmount + taxAmount;

    // Insert bill
    const [billResult] = await connection.execute(
      `INSERT INTO Bill (bill_number, patient_id, total_amount, discount_amount, tax_amount, final_amount, generated_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [billNumber, patientId, totalAmount, discountAmount, taxAmount, finalAmount, generatedBy || req.user?.userId]
    );

    const billId = billResult.insertId;

    // Insert bill items
    for (const item of items) {
      await connection.execute(
        `INSERT INTO BillItem (bill_id, service_id, medicine_id, description, quantity, unit_price, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [billId, item.serviceId, item.medicineId, item.description, item.quantity, item.unitPrice, item.quantity * item.unitPrice]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: {
        billId,
        billNumber,
        totalAmount,
        discountAmount,
        taxAmount,
        finalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get all bills
export const getBills = async (req, res) => {
  try {
    const { patientId, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (patientId) {
      whereClause += ' AND b.patient_id = ?';
      params.push(patientId);
    }

    if (status) {
      whereClause += ' AND b.status = ?';
      params.push(status);
    }

    if (startDate) {
      whereClause += ' AND DATE(b.bill_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(b.bill_date) <= ?';
      params.push(endDate);
    }

    const bills = await query(
      `SELECT
        b.bill_id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.discount_amount,
        b.tax_amount,
        b.final_amount,
        b.status,
        b.due_date,
        p.patient_code,
        CONCAT(pers.first_name, ' ', pers.last_name) AS patient_name,
        pers.phone AS patient_phone,
        (SELECT COALESCE(SUM(amount), 0) FROM Payment WHERE bill_id = b.bill_id) AS paid_amount
       FROM Bill b
       JOIN Patient p ON b.patient_id = p.patient_id
       JOIN Person pers ON p.patient_id = pers.person_id
       ${whereClause}
       ORDER BY b.bill_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM Bill b ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        bills,
        pagination: {
          total: countResult[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bills',
      error: error.message
    });
  }
};

// Get bill by ID
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bills = await query(
      `SELECT
        b.*,
        p.patient_code,
        CONCAT(pers.first_name, ' ', pers.last_name) AS patient_name,
        pers.nic AS patient_nic,
        pers.phone AS patient_phone,
        pers.email AS patient_email,
        CONCAT(gen_first.first_name, ' ', gen_first.last_name) AS generated_by_name
       FROM Bill b
       JOIN Patient p ON b.patient_id = p.patient_id
       JOIN Person pers ON p.patient_id = pers.person_id
       LEFT JOIN Staff gen_s ON b.generated_by = gen_s.staff_id
       LEFT JOIN Person gen_first ON gen_s.staff_id = gen_first.person_id
       WHERE b.bill_id = ?`,
      [id]
    );

    if (!bills || bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get bill items
    const items = await query(
      `SELECT
        bi.*,
        st.service_name,
        m.medicine_name
       FROM BillItem bi
       LEFT JOIN ServiceType st ON bi.service_id = st.service_id
       LEFT JOIN Medicine m ON bi.medicine_id = m.medicine_id
       WHERE bi.bill_id = ?`,
      [id]
    );

    // Get payments
    const payments = await query(
      `SELECT
        p.payment_id,
        p.payment_date,
        p.amount,
        p.payment_method,
        p.payment_reference,
        CONCAT(staff_first.first_name, ' ', staff_first.last_name) AS received_by_name
       FROM Payment p
       LEFT JOIN Staff staff ON p.received_by = staff.staff_id
       LEFT JOIN Person staff_first ON staff.staff_id = staff_first.person_id
       WHERE p.bill_id = ?`,
      [id]
    );

    res.json({
      success: true,
      data: {
        bill: bills[0],
        items,
        payments
      }
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bill',
      error: error.message
    });
  }
};

// Make payment
export const makePayment = async (req, res) => {
  try {
    const { billId, amount, paymentMethod, paymentReference, notes } = req.body;

    if (!billId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Bill ID, amount, and payment method are required'
      });
    }

    const validMethods = ['Cash', 'Card', 'Insurance', 'Bank Transfer', 'Cheque', 'Online'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Get bill details
    const bills = await query(
      `SELECT final_amount, status FROM Bill WHERE bill_id = ?`,
      [billId]
    );

    if (!bills || bills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    const bill = bills[0];

    // Get already paid amount
    const paidResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS paid FROM Payment WHERE bill_id = ?`,
      [billId]
    );

    const alreadyPaid = paidResult[0].paid;
    const remainingAmount = bill.final_amount - alreadyPaid;

    if (amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount exceeds remaining balance (${remainingAmount})`
      });
    }

    // Insert payment
    const result = await query(
      `INSERT INTO Payment (bill_id, amount, payment_method, payment_reference, notes, received_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [billId, amount, paymentMethod, paymentReference, notes, req.user?.userId]
    );

    // Update bill status
    let newStatus = bill.status;
    if (alreadyPaid + amount >= bill.final_amount) {
      newStatus = 'Paid';
    } else if (alreadyPaid > 0 || amount > 0) {
      newStatus = 'Partial';
    }

    await query(
      `UPDATE Bill SET status = ? WHERE bill_id = ?`,
      [newStatus, billId]
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        paymentId: result.insertId,
        remainingBalance: remainingAmount - amount,
        billStatus: newStatus
      }
    });
  } catch (error) {
    console.error('Make payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Get billing statistics
export const getBillingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let whereClause = 'WHERE status != \'Cancelled\'';
    const params = [];

    if (startDate) {
      whereClause += ' AND DATE(bill_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(bill_date) <= ?';
      params.push(endDate);
    }

    const stats = await query(`
      SELECT
        COUNT(*) AS total_bills,
        SUM(final_amount) AS total_revenue,
        SUM(CASE WHEN status = 'Paid' THEN final_amount ELSE 0 END) AS collected_amount,
        SUM(CASE WHEN status IN ('Pending', 'Partial') THEN final_amount ELSE 0 END) AS pending_amount,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
        AVG(final_amount) AS avg_bill_amount
      FROM Bill
      ${whereClause}
    `, params);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get billing statistics',
      error: error.message
    });
  }
};

// Get revenue report (uses stored procedure with window functions)
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
