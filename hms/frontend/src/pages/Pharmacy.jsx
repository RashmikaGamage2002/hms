import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { Pill, AlertTriangle, Package, TrendingDown, Plus, Search, X, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Pharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medicines');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [lowStock, setLowStock] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [editMedicineForm, setEditMedicineForm] = useState({});

  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    generic_name: '',
    category_id: '',
    dosage_form: 'Tablet',
    strength: '',
    unit_price: '',
    requires_prescription: false,
    batch_number: '',
    stock_quantity: '',
    reorder_level: '10',
    expiry_date: '',
    supplier_name: '',
    unit_cost: '',
    location: ''
  });

  const dosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream',
    'Ointment', 'Drops', 'Inhaler', 'Other'
  ];

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [searchTerm, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'medicines') {
        const response = await api.get(`/pharmacy?search=${searchTerm}`);
        setMedicines(response.data.data || []);
      } else {
        const response = await api.get('/pharmacy/inventory');
        setInventory(response.data.data || []);
      }
      const lowStockRes = await api.get('/pharmacy/low-stock');
      setLowStock(lowStockRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load pharmacy data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/pharmacy/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        medicine_name: newMedicine.medicine_name,
        generic_name: newMedicine.generic_name || null,
        category_id: newMedicine.category_id || null,
        dosage_form: newMedicine.dosage_form,
        strength: newMedicine.strength || null,
        unit_price: parseFloat(newMedicine.unit_price),
        requires_prescription: newMedicine.requires_prescription,
        batch_number: newMedicine.batch_number,
        stock_quantity: parseInt(newMedicine.stock_quantity),
        reorder_level: parseInt(newMedicine.reorder_level),
        expiry_date: newMedicine.expiry_date,
        supplier_name: newMedicine.supplier_name || null,
        unit_cost: newMedicine.unit_cost ? parseFloat(newMedicine.unit_cost) : null,
        location: newMedicine.location || null
      };

      await api.post('/pharmacy/medicine', submitData);
      toast.success('Medicine added successfully');
      setShowAddModal(false);
      resetMedicineForm();
      fetchData();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error(error.response?.data?.message || 'Failed to add medicine');
    }
  };

  const resetMedicineForm = () => {
    setNewMedicine({
      medicine_name: '',
      generic_name: '',
      category_id: '',
      dosage_form: 'Tablet',
      strength: '',
      unit_price: '',
      requires_prescription: false,
      batch_number: '',
      stock_quantity: '',
      reorder_level: '10',
      expiry_date: '',
      supplier_name: '',
      unit_cost: '',
      location: ''
    });
  };

  const handleMedicineChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewMedicine({
      ...newMedicine,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditMedicine = (med) => {
    setSelectedMedicine(med);
    setEditMedicineForm({
      medicine_name: med.medicine_name || '',
      generic_name: med.generic_name || '',
      category_id: med.category_id || '',
      dosage_form: med.dosage_form || 'Tablet',
      strength: med.strength || '',
      unit_price: med.unit_price || '',
      requires_prescription: med.requires_prescription === 1,
    });
    setShowEditMedicineModal(true);
  };

  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/pharmacy/medicine/${selectedMedicine.medicine_id}`, editMedicineForm);
      toast.success('Medicine updated successfully');
      setShowEditMedicineModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update medicine');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/pharmacy/medicine/${id}`);
        toast.success('Medicine deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const getStatusBadge = (stock, isLow) => {
    if (stock === 0) return 'error';
    if (isLow) return 'warning';
    return 'success';
  };

  const getInventoryStatusBadge = (status) => {
    switch (status) {
      case 'LOW': return 'warning';
      case 'OUT': return 'error';
      default: return 'success';
    }
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Pharmacy</h1>
            <p className="page-subtitle">Manage medicines and inventory</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={20} />
            Add Medicine
          </button>
        </header>

        {/* Stats Cards */}
        <section className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-teal">
              <Pill size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{medicines.length}</div>
              <div className="stat-label">Total Medicines</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-orange">
              <AlertTriangle size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{lowStock.length}</div>
              <div className="stat-label">Low Stock Items</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-blue">
              <Package size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{inventory.length}</div>
              <div className="stat-label">Inventory Batches</div>
            </div>
          </div>
        </section>

        {/* Low Stock Alerts */}
        {lowStock.length > 0 && (
          <div className="alert-banner glass-card">
            <AlertTriangle size={24} color="var(--warning)" />
            <div>
              <strong>Low Stock Alert:</strong> {lowStock.length} items need restocking
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'medicines' ? 'active' : ''}`}
              onClick={() => setActiveTab('medicines')}
            >
              Medicines
            </button>
            <button
              className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              Inventory
            </button>
          </div>

          <div className="search-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Content */}
        <div className="glass-card table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          ) : activeTab === 'medicines' ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Generic Name</th>
                    <th>Category</th>
                    <th>Dosage</th>
                    <th>Strength</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => (
                    <tr key={med.medicine_id}>
                      <td className="name-cell">{med.medicine_name}</td>
                      <td>{med.generic_name || '-'}</td>
                      <td>{med.category_name || '-'}</td>
                      <td>{med.dosage_form}</td>
                      <td>{med.strength || '-'}</td>
                      <td>LKR {parseFloat(med.unit_price).toFixed(2)}</td>
                      <td>{med.current_stock || 0}</td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(med.current_stock, med.is_low_stock)}`}>
                          {med.current_stock === 0 ? 'Out of Stock' : med.is_low_stock ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => handleEditMedicine(med)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDeleteMedicine(med.medicine_id, med.medicine_name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch Number</th>
                    <th>Quantity</th>
                    <th>Reorder Level</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id}>
                      <td className="name-cell">{item.medicine_name}</td>
                      <td><code className="batch-code">{item.batch_number}</code></td>
                      <td>{item.stock_quantity}</td>
                      <td>{item.reorder_level}</td>
                      <td>{new Date(item.expiry_date).toLocaleDateString()}</td>
                      <td>
                        <span className={item.days_until_expiry <= 30 ? 'text-warning' : ''}>
                          {item.days_until_expiry} days
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${getInventoryStatusBadge(item.status)}`}>
                          {item.status === 'OK' ? 'In Stock' : item.status === 'LOW' ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-medicine-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Add New Medicine</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddMedicine} className="modal-form">
              <div className="form-section-title">Medicine Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input
                    type="text"
                    name="medicine_name"
                    className="form-input"
                    value={newMedicine.medicine_name}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Generic Name</label>
                  <input
                    type="text"
                    name="generic_name"
                    className="form-input"
                    value={newMedicine.generic_name}
                    onChange={handleMedicineChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category_id"
                    className="form-select"
                    value={newMedicine.category_id}
                    onChange={handleMedicineChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage Form *</label>
                  <select
                    name="dosage_form"
                    className="form-select"
                    value={newMedicine.dosage_form}
                    onChange={handleMedicineChange}
                    required
                  >
                    {dosageForms.map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Strength</label>
                  <input
                    type="text"
                    name="strength"
                    className="form-input"
                    placeholder="e.g., 500mg, 10ml"
                    value={newMedicine.strength}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (LKR) *</label>
                  <input
                    type="number"
                    name="unit_price"
                    className="form-input"
                    step="0.01"
                    value={newMedicine.unit_price}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requires_prescription"
                    checked={newMedicine.requires_prescription}
                    onChange={handleMedicineChange}
                  />
                  Requires Prescription
                </label>
              </div>

              <div className="form-section-title">Inventory Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Batch Number *</label>
                  <input
                    type="text"
                    name="batch_number"
                    className="form-input"
                    value={newMedicine.batch_number}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    className="form-input"
                    value={newMedicine.stock_quantity}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    name="reorder_level"
                    className="form-input"
                    value={newMedicine.reorder_level}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiry_date"
                    className="form-input"
                    value={newMedicine.expiry_date}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    name="supplier_name"
                    className="form-input"
                    value={newMedicine.supplier_name}
                    onChange={handleMedicineChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    name="unit_cost"
                    className="form-input"
                    step="0.01"
                    value={newMedicine.unit_cost}
                    onChange={handleMedicineChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-input"
                  placeholder="e.g., Shelf A1"
                  value={newMedicine.location}
                  onChange={handleMedicineChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditMedicineModal && selectedMedicine && (
        <div className="modal-overlay" onClick={() => setShowEditMedicineModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Medicine</h2>
              <button className="btn-close" onClick={() => setShowEditMedicineModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMedicine} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input
                    type="text"
                    name="medicine_name"
                    className="form-input"
                    value={editMedicineForm.medicine_name}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, medicine_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Generic Name</label>
                  <input
                    type="text"
                    name="generic_name"
                    className="form-input"
                    value={editMedicineForm.generic_name}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, generic_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category_id"
                    className="form-select"
                    value={editMedicineForm.category_id}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, category_id: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage Form *</label>
                  <select
                    name="dosage_form"
                    className="form-select"
                    value={editMedicineForm.dosage_form}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, dosage_form: e.target.value})}
                    required
                  >
                    {dosageForms.map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Strength (e.g., 500mg)</label>
                  <input
                    type="text"
                    name="strength"
                    className="form-input"
                    value={editMedicineForm.strength}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, strength: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="unit_price"
                    className="form-input"
                    value={editMedicineForm.unit_price}
                    onChange={(e) => setEditMedicineForm({...editMedicineForm, unit_price: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="requires_prescription"
                      checked={editMedicineForm.requires_prescription}
                      onChange={(e) => setEditMedicineForm({...editMedicineForm, requires_prescription: e.target.checked})}
                    />
                    Requires Prescription
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditMedicineModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: var(--background);
        }

        .alert-banner {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          background: rgba(249, 168, 37, 0.1);
          border: 1px solid rgba(249, 168, 37, 0.3);
          border-radius: var(--radius-md);
        }

        .tabs-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          gap: var(--spacing-md);
        }

        .tabs {
          display: flex;
          gap: var(--spacing-sm);
          background: rgba(0, 151, 167, 0.1);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
        }

        .tab {
          padding: var(--spacing-sm) var(--spacing-lg);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .tab:hover {
          color: var(--primary-teal);
        }

        .tab.active {
          background: white;
          color: var(--primary-teal);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: white;
          border: 2px solid rgba(0, 151, 167, 0.2);
          border-radius: var(--radius-md);
          min-width: 250px;
        }

        .search-input {
          border: none;
          outline: none;
          font-size: 1rem;
          background: transparent;
        }

        .table-section {
          padding: var(--spacing-lg);
        }

        .loading-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }

        .name-cell {
          font-weight: 500;
        }

        .batch-code {
          background: rgba(0, 151, 167, 0.1);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 0.85rem;
        }

        .text-warning {
          color: var(--warning);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
        }

        .modal-content {
          width: 100%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          padding: var(--spacing-xl);
          background: var(--surface);
          border-radius: var(--radius-lg);
        }

        .add-medicine-modal {
          background: #e5e7eb !important; /* Premium solid gray background */
          border: 2px solid #9ca3af !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .add-medicine-modal h2 {
          color: #000000 !important;
          font-weight: 700 !important;
        }

        .add-medicine-modal .btn-close {
          color: #000000 !important;
          font-weight: 700 !important;
        }

        .add-medicine-modal .form-section-title {
          color: #000000 !important;
          border-top: 1px solid rgba(0, 0, 0, 0.15) !important;
          font-weight: 700 !important;
        }

        .add-medicine-modal .form-label {
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .add-medicine-modal .checkbox-label {
          color: #000000 !important;
          font-weight: 600 !important;
        }

        .add-medicine-modal .form-input,
        .add-medicine-modal .form-select {
          color: #000000 !important;
          border: 2px solid #9ca3af !important;
          background: #ffffff !important;
        }

        .add-medicine-modal .form-input:focus,
        .add-medicine-modal .form-select:focus {
          border-color: #4b5563 !important;
          outline: none !important;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modal-header h2 {
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: var(--text-muted);
          cursor: pointer;
          line-height: 1;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .form-input, .form-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid rgba(0, 151, 167, 0.2);
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          background: white;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--primary-teal);
        }

        .form-section-title {
          font-weight: 600;
          color: var(--primary-teal);
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .stat-icon-teal {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
        }

        .stat-icon-orange {
          background: rgba(249, 168, 37, 0.1);
          color: var(--warning);
        }

        .stat-icon-blue {
          background: rgba(33, 150, 243, 0.1);
          color: #2196F3;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-lg);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .btn-secondary {
          background: rgba(0, 0, 0, 0.1);
          color: var(--text-primary);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th, .table td {
          padding: var(--spacing-md);
          text-align: left;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .badge-success {
          background: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        }

        .badge-warning {
          background: rgba(249, 168, 37, 0.1);
          color: #F9A825;
        }

        .badge-error {
          background: rgba(198, 40, 40, 0.1);
          color: #C62828;
        }

        @media (max-width: 768px) {
          .tabs-container {
            flex-direction: column;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Pharmacy;