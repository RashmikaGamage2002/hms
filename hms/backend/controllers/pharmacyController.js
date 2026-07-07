import { query, getConnection } from '../config/database.js';

// Get all medicines
export const getMedicines = async (req, res) => {
  try {
    const { category, search, requiresPrescription, isControlled } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (category) {
      whereClause += ` AND m.category_id = ?`;
      params.push(category);
    }

    if (search) {
      whereClause += ` AND (m.medicine_name LIKE ? OR m.generic_name LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (requiresPrescription !== undefined) {
      whereClause += ` AND m.requires_prescription = ?`;
      params.push(requiresPrescription === 'true' ? 1 : 0);
    }

    if (isControlled !== undefined) {
      whereClause += ` AND m.is_controlled = ?`;
      params.push(isControlled === 'true' ? 1 : 0);
    }

    const medicines = await query(
      `SELECT
        m.medicine_id,
        m.medicine_name,
        m.generic_name,
        mc.category_name,
        m.manufacturer,
        m.dosage_form,
        m.strength,
        m.unit_price,
        m.requires_prescription,
        m.is_controlled,
        get_medicine_stock(m.medicine_id) AS current_stock,
        is_low_stock(m.medicine_id) AS is_low_stock
       FROM Medicine m
       LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
       ${whereClause}
       ORDER BY m.medicine_name`,
      params
    );

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicines',
      error: error.message
    });
  }
};

// Get medicine by ID
export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    const medicines = await query(
      `SELECT
        m.*,
        mc.category_name,
        get_medicine_stock(m.medicine_id) AS current_stock
       FROM Medicine m
       LEFT JOIN MedicineCategory mc ON m.category_id = mc.category_id
       WHERE m.medicine_id = ?`,
      [id]
    );

    if (!medicines || medicines.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Get inventory batches
    const inventory = await query(
      `SELECT * FROM Inventory WHERE medicine_id = ? AND stock_quantity > 0 ORDER BY expiry_date`,
      [id]
    );

    res.json({
      success: true,
      data: {
        medicine: medicines[0],
        inventory
      }
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medicine',
      error: error.message
    });
  }
};

// Add new medicine
export const addMedicine = async (req, res) => {
  try {
    const {
      medicineName,
      genericName,
      categoryId,
      manufacturer,
      dosageForm,
      strength,
      unitPrice,
      requiresPrescription,
      isControlled
    } = req.body;

    if (!medicineName || !dosageForm || !unitPrice) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await query(
      `INSERT INTO Medicine (medicine_name, generic_name, category_id, manufacturer, dosage_form, strength, unit_price, requires_prescription, is_controlled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicineName, genericName, categoryId, manufacturer, dosageForm, strength, unitPrice, requiresPrescription ?? 1, isControlled ?? 0]
    );

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: {
        medicineId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medicine',
      error: error.message
    });
  }
};

// Update medicine
export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      medicineName,
      genericName,
      categoryId,
      manufacturer,
      dosageForm,
      strength,
      unitPrice,
      requiresPrescription,
      isControlled
    } = req.body;

    await query(
      `UPDATE Medicine SET
       medicine_name = ?, generic_name = ?, category_id = ?, manufacturer = ?,
       dosage_form = ?, strength = ?, unit_price = ?, requires_prescription = ?, is_controlled = ?
       WHERE medicine_id = ?`,
      [medicineName, genericName, categoryId, manufacturer, dosageForm, strength, unitPrice, requiresPrescription, isControlled, id]
    );

    res.json({
      success: true,
      message: 'Medicine updated successfully'
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update medicine',
      error: error.message
    });
  }
};

// Get inventory with stock levels
export const getInventory = async (req, res) => {
  try {
    const { lowStockOnly, expiringSoon, medicineId } = req.query;

    let whereClause = 'WHERE i.stock_quantity > 0 AND i.expiry_date > CURDATE()';
    const params = [];

    if (lowStockOnly === 'true') {
      whereClause = 'WHERE i.stock_quantity <= i.reorder_level AND i.expiry_date > CURDATE()';
    }

    if (expiringSoon === 'true') {
      whereClause = 'WHERE i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND i.stock_quantity > 0';
    }

    if (medicineId) {
      whereClause += medicineId ? ' AND i.medicine_id = ?' : '';
      params.push(medicineId);
    }

    const inventory = await query(
      `SELECT
        i.inventory_id,
        i.medicine_id,
        m.medicine_name,
        m.generic_name,
        i.batch_number,
        i.stock_quantity,
        i.reorder_level,
        i.expiry_date,
        i.received_date,
        i.supplier_name,
        i.unit_cost,
        i.location,
        DATEDIFF(i.expiry_date, CURDATE()) AS days_until_expiry,
        CASE
          WHEN i.stock_quantity = 0 THEN 'OUT'
          WHEN i.stock_quantity <= i.reorder_level THEN 'LOW'
          WHEN i.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'EXPIRING'
          ELSE 'OK'
        END AS status
       FROM Inventory i
       JOIN Medicine m ON i.medicine_id = m.medicine_id
       ${whereClause}
       ORDER BY i.expiry_date`,
      params
    );

    res.json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory',
      error: error.message
    });
  }
};

// Add inventory stock
export const addInventory = async (req, res) => {
  try {
    const {
      medicineId,
      batchNumber,
      stockQuantity,
      reorderLevel,
      expiryDate,
      supplierName,
      unitCost,
      location
    } = req.body;

    if (!medicineId || !batchNumber || !stockQuantity || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const result = await query(
      `INSERT INTO Inventory (medicine_id, batch_number, stock_quantity, reorder_level, expiry_date, supplier_name, unit_cost, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [medicineId, batchNumber, stockQuantity, reorderLevel || 10, expiryDate, supplierName, unitCost, location]
    );

    res.status(201).json({
      success: true,
      message: 'Inventory added successfully',
      data: {
        inventoryId: result.insertId
      }
    });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory',
      error: error.message
    });
  }
};

// Dispense medicine (triggers auto inventory deduction)
export const dispenseMedicine = async (req, res) => {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const { prescriptionId, medicineId, quantity, pharmacistId, notes } = req.body;

    if (!prescriptionId || !medicineId || !quantity || !pharmacistId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get inventory with earliest expiry (FEFO)
    const [inventoryRows] = await connection.execute(
      `SELECT inventory_id, batch_number, stock_quantity
       FROM Inventory
       WHERE medicine_id = ? AND stock_quantity >= ? AND expiry_date > CURDATE()
       ORDER BY expiry_date ASC
       LIMIT 1
       FOR UPDATE`,
      [medicineId, quantity]
    );

    if (!inventoryRows || inventoryRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock for this medicine'
      });
    }

    const inventory = inventoryRows[0];

    // Insert dispensing record (trigger will auto-deduct inventory)
    const [dispensingResult] = await connection.execute(
      `INSERT INTO Dispensing (prescription_id, medicine_id, pharmacist_id, inventory_id, quantity_dispensed, batch_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [prescriptionId, medicineId, pharmacistId, inventory.inventory_id, quantity, inventory.batch_number, notes]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Medicine dispensed successfully. Inventory updated automatically.',
      data: {
        dispensingId: dispensingResult.insertId,
        batchNumber: inventory.batch_number,
        remainingStock: inventory.stock_quantity - quantity
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Dispense medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dispense medicine',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get low stock medicines
export const getLowStockMedicines = async (req, res) => {
  try {
    const result = await query(`CALL sp_get_low_stock_medicines()`);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock medicines',
      error: error.message
    });
  }
};

// Get expiring medicines
export const getExpiringMedicines = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await query(`CALL sp_get_expiring_medicines(?)`, [days]);

    res.json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Get expiring medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring medicines',
      error: error.message
    });
  }
};

// Get pharmacy statistics
export const getPharmacyStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM Medicine) AS total_medicines,
        (SELECT COUNT(*) FROM Inventory WHERE stock_quantity > 0 AND expiry_date > CURDATE()) AS in_stock_items,
        (SELECT COUNT(*) FROM vw_low_stock WHERE stock_status != 'OK') AS low_stock_count,
        (SELECT COUNT(*) FROM Inventory WHERE expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND stock_quantity > 0) AS expiring_count,
        (SELECT COUNT(*) FROM Dispensing WHERE DATE(dispensing_date) = CURDATE()) AS today_dispensings
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Get pharmacy stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pharmacy statistics',
      error: error.message
    });
  }
};
