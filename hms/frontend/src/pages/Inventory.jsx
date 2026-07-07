import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  AlertTriangle,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  Truck,
  MapPin,
  ClipboardList,
  Activity,
  FileText,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Inventory = () => {
  const { user } = useAuth();

  // State variables
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState({
    total_medicines: 0,
    in_stock_items: 0,
    low_stock_count: 0,
    expiring_count: 0,
    today_dispensings: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'low_stock', 'expiring'

  // Modal states
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [stockForm, setStockForm] = useState({
    medicineId: '',
    batchNumber: '',
    stockQuantity: '',
    reorderLevel: 10,
    expiryDate: '',
    supplierName: '',
    unitCost: '',
    location: ''
  });

  const [editStockForm, setEditStockForm] = useState({
    batchNumber: '',
    stockQuantity: '',
    reorderLevel: 10,
    expiryDate: '',
    supplierName: '',
    unitCost: '',
    location: ''
  });

  const [dispenseForm, setDispenseForm] = useState({
    prescriptionId: '',
    medicineId: '',
    quantity: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventoryAndStats();
    fetchMedicines();
  }, [filterType, searchTerm]);

  const fetchInventoryAndStats = async () => {
    try {
      setLoading(true);

      // Construct query parameters
      let queryParams = [];
      if (filterType === 'low_stock') {
        queryParams.push('lowStockOnly=true');
      } else if (filterType === 'expiring') {
        queryParams.push('expiringSoon=true');
      }

      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const [inventoryRes, statsRes] = await Promise.all([
        api.get(`/pharmacy/inventory${queryStr}`),
        api.get('/pharmacy/stats')
      ]);

      // Apply client-side search filter on top
      let data = inventoryRes.data.data || [];
      if (searchTerm) {
        data = data.filter(item =>
          item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.generic_name && item.generic_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          item.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setInventory(data);
      setStats(statsRes.data.data || {
        total_medicines: 0,
        in_stock_items: 0,
        low_stock_count: 0,
        expiring_count: 0,
        today_dispensings: 0
      });
    } catch (error) {
      toast.error('Failed to retrieve inventory data');
      console.error('Inventory fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/pharmacy');
      setMedicines(res.data.data || []);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();

    if (!stockForm.medicineId || !stockForm.batchNumber || !stockForm.stockQuantity || !stockForm.expiryDate) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        medicineId: parseInt(stockForm.medicineId),
        batchNumber: stockForm.batchNumber,
        stockQuantity: parseInt(stockForm.stockQuantity),
        reorderLevel: parseInt(stockForm.reorderLevel) || 10,
        expiryDate: stockForm.expiryDate,
        supplierName: stockForm.supplierName || null,
        unitCost: stockForm.unitCost ? parseFloat(stockForm.unitCost) : null,
        location: stockForm.location || null
      };

      await api.post('/pharmacy/inventory', payload);
      toast.success('Stock batch added successfully');
      setShowAddStockModal(false);
      resetStockForm();
      fetchInventoryAndStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update stock';
      toast.error(msg);
      console.error('Add stock error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();

    if (!dispenseForm.prescriptionId || !dispenseForm.medicineId || !dispenseForm.quantity) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const pharmacistId = user?.personId || user?.userId || 1;

      const payload = {
        prescriptionId: parseInt(dispenseForm.prescriptionId),
        medicineId: parseInt(dispenseForm.medicineId),
        quantity: parseInt(dispenseForm.quantity),
        pharmacistId: parseInt(pharmacistId),
        notes: dispenseForm.notes || null
      };

      const res = await api.post('/pharmacy/dispense', payload);
      const data = res.data.data;

      toast.success(
        `Dispensed successfully from Batch: ${data.batchNumber}. Remaining stock: ${data.remainingStock}`
      );

      setShowDispenseModal(false);
      resetDispenseForm();
      fetchInventoryAndStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to dispense medicine';
      toast.error(msg);
      console.error('Dispense error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStock = (item) => {
    setSelectedStock(item);
    setEditStockForm({
      batchNumber: item.batch_number || '',
      stockQuantity: item.stock_quantity || '',
      reorderLevel: item.reorder_level || 10,
      expiryDate: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      supplierName: item.supplier_name || '',
      unitCost: item.unit_cost || '',
      location: item.location || ''
    });
    setShowEditStockModal(true);
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/pharmacy/inventory/${selectedStock.inventory_id}`, editStockForm);
      toast.success('Stock updated successfully');
      setShowEditStockModal(false);
      fetchInventoryAndStats();
    } catch (error) {
      toast.error('Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStock = async (inventoryId, batchName) => {
    if (window.confirm(`Are you sure you want to delete batch ${batchName}?`)) {
      try {
        await api.delete(`/pharmacy/inventory/${inventoryId}`);
        toast.success('Batch deleted successfully');
        fetchInventoryAndStats();
      } catch (error) {
        toast.error('Failed to delete batch');
      }
    }
  };

  const resetStockForm = () => {
    setStockForm({
      medicineId: '',
      batchNumber: '',
      stockQuantity: '',
      reorderLevel: 10,
      expiryDate: '',
      supplierName: '',
      unitCost: '',
      location: ''
    });
  };

  const resetDispenseForm = () => {
    setDispenseForm({
      prescriptionId: '',
      medicineId: '',
      quantity: '',
      notes: ''
    });
  };

  // Status badges formatter
  const getStatusBadge = (status, daysUntilExpiry) => {
    if (status === 'OUT' || daysUntilExpiry <= 0) return 'badge-error';
    if (status === 'LOW') return 'badge-warning';
    if (status === 'EXPIRING' || daysUntilExpiry <= 30) return 'badge-warning';
    return 'badge-success';
  };

  const getStatusText = (status, daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return 'Expired';
    if (status === 'OUT') return 'Out of Stock';
    if (status === 'LOW') return 'Low Stock';
    if (status === 'EXPIRING' || daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'In Stock';
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Inventory Control</h1>
            <p className="page-subtitle">Manage medicine batches, shelf lifespans, reorder points, and dispensations</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary mr-sm" onClick={() => setShowDispenseModal(true)}>
              <ArrowRightLeft size={18} />
              Dispense Stock
            </button>
            <button className="btn btn-primary" onClick={() => setShowAddStockModal(true)}>
              <Plus size={20} />
              Add Stock Batch
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-teal">
              <Package size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.in_stock_items}</div>
              <div className="stat-label">In-Stock Batches</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-orange">
              <AlertTriangle size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value text-warning">{stats.low_stock_count}</div>
              <div className="stat-label">Low Stock Alerts</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-blue">
              <Calendar size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value text-error">{stats.expiring_count}</div>
              <div className="stat-label">Expiring Soon</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-green">
              <Activity size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.today_dispensings}</div>
              <div className="stat-label">Dispensed Today</div>
            </div>
          </div>
        </section>

        {/* Filters and Search Bar */}
        <div className="filter-bar-card glass-card mb-lg">
          <div className="filter-pill-selector">
            <button
              className={`filter-tab-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All Batches
            </button>
            <button
              className={`filter-tab-pill ${filterType === 'low_stock' ? 'active' : ''}`}
              onClick={() => setFilterType('low_stock')}
            >
              Low Stock Alerts
            </button>
            <button
              className={`filter-tab-pill ${filterType === 'expiring' ? 'active' : ''}`}
              onClick={() => setFilterType('expiring')}
            >
              Expiring Soon (30d)
            </button>
          </div>

          <div className="search-input-wrapper flex-grow-1">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by medicine name, generic description, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Inventory List */}
        <div className="glass-card table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading inventory logs...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="empty-state">
              <Package size={48} className="text-muted mb-md" />
              <h3>No Batches Found</h3>
              <p>No inventory listings matched your filters or search query.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch ID</th>
                    <th>Remaining Stock</th>
                    <th>Reorder Lvl</th>
                    <th>Expiry Date</th>
                    <th>Shelf Status</th>
                    <th>Location</th>
                    <th>Unit Cost</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.inventory_id} className={item.days_until_expiry <= 0 ? 'row-expired' : ''}>
                      <td>
                        <div className="med-details-cell">
                          <span className="med-title">{item.medicine_name}</span>
                          {item.generic_name && (
                            <span className="med-sub">{item.generic_name}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <code className="batch-badge">{item.batch_number}</code>
                      </td>
                      <td className="font-weight-600">
                        {item.stock_quantity}
                      </td>
                      <td className="text-muted">
                        {item.reorder_level}
                      </td>
                      <td>
                        <div className="expiry-date-cell">
                          <span>{new Date(item.expiry_date).toLocaleDateString()}</span>
                          <span className={`expiry-countdown ${item.days_until_expiry <= 30 ? 'soon' : 'ok'}`}>
                            {item.days_until_expiry <= 0
                              ? 'Expired'
                              : `${item.days_until_expiry} days left`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(item.status, item.days_until_expiry)}`}>
                          {getStatusText(item.status, item.days_until_expiry)}
                        </span>
                      </td>
                      <td>
                        {item.location ? (
                          <div className="location-cell">
                            <MapPin size={14} className="text-muted" />
                            <span>{item.location}</span>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {item.unit_cost ? `LKR ${parseFloat(item.unit_cost).toFixed(2)}` : '-'}
                      </td>
                      <td className="text-muted supplier-cell">
                        {item.supplier_name ? (
                          <div className="supplier-wrapper" title={item.supplier_name}>
                            <Truck size={14} />
                            <span>{item.supplier_name}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-icon" onClick={() => handleEditStock(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDeleteStock(item.inventory_id, item.batch_number)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Stock Batch Modal */}
      {showAddStockModal && (
        <div className="modal-overlay" onClick={() => setShowAddStockModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Stock Batch</h2>
              <button className="btn-close" onClick={() => setShowAddStockModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddStock} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Medicine *</label>
                <select
                  className="form-select"
                  value={stockForm.medicineId}
                  onChange={(e) => setStockForm({ ...stockForm, medicineId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.medicine_id} value={m.medicine_id}>
                      {m.medicine_name} ({m.strength}) - Current Stock: {m.current_stock || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Batch Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BNT-2026A"
                    value={stockForm.batchNumber}
                    onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    placeholder="Quantity"
                    value={stockForm.stockQuantity}
                    onChange={(e) => setStockForm({ ...stockForm, stockQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={stockForm.expiryDate}
                    onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={stockForm.reorderLevel}
                    onChange={(e) => setStockForm({ ...stockForm, reorderLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 85.00"
                    value={stockForm.unitCost}
                    onChange={(e) => setStockForm({ ...stockForm, unitCost: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Shelf C3-Top"
                    value={stockForm.location}
                    onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MedLink Pharma Distributors"
                  value={stockForm.supplierName}
                  onChange={(e) => setStockForm({ ...stockForm, supplierName: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddStockModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispense Stock Modal */}
      {showDispenseModal && (
        <div className="modal-overlay" onClick={() => setShowDispenseModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dispense Prescription Medicine</h2>
              <button className="btn-close" onClick={() => setShowDispenseModal(false)}>×</button>
            </div>

            <form onSubmit={handleDispense} className="modal-form">
              <div className="form-group">
                <label className="form-label">Prescription ID *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Enter Prescription Reference ID"
                  value={dispenseForm.prescriptionId}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, prescriptionId: e.target.value })}
                  required
                />
                <span className="input-helper-text">
                  Verifies medicine is backed by a valid consultation script
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Select Medicine *</label>
                <select
                  className="form-select"
                  value={dispenseForm.medicineId}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, medicineId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map(m => (
                    <option key={m.medicine_id} value={m.medicine_id} disabled={!m.current_stock}>
                      {m.medicine_name} ({m.strength}) - Available Stock: {m.current_stock || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dispense Quantity *</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  placeholder="e.g. 30"
                  value={dispenseForm.quantity}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: e.target.value })}
                  required
                />
                <span className="input-helper-text">
                  Deducts automatically from earliest-expiring batch (First Expiry First Out - FEFO)
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Dispensing Notes</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="e.g. Dispensed once a day after meals, standard packaging"
                  value={dispenseForm.notes}
                  onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDispenseModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Dispensing...' : 'Dispense Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {showEditStockModal && (
        <div className="modal-overlay" onClick={() => setShowEditStockModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Stock Batch</h2>
              <button className="btn-close" onClick={() => setShowEditStockModal(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateStock} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Batch Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editStockForm.batchNumber}
                    onChange={(e) => setEditStockForm({ ...editStockForm, batchNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    value={editStockForm.stockQuantity}
                    onChange={(e) => setEditStockForm({ ...editStockForm, stockQuantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editStockForm.expiryDate}
                    onChange={(e) => setEditStockForm({ ...editStockForm, expiryDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={editStockForm.reorderLevel}
                    onChange={(e) => setEditStockForm({ ...editStockForm, reorderLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Unit Cost (LKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={editStockForm.unitCost}
                    onChange={(e) => setEditStockForm({ ...editStockForm, unitCost: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shelf / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editStockForm.location}
                    onChange={(e) => setEditStockForm({ ...editStockForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editStockForm.supplierName}
                  onChange={(e) => setEditStockForm({ ...editStockForm, supplierName: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditStockModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Batch'}
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

        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .filter-bar-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-md) var(--spacing-lg);
        }

        .filter-pill-selector {
          display: flex;
          background: rgba(0, 151, 167, 0.08);
          padding: 4px;
          border-radius: var(--radius-md);
          gap: 2px;
        }

        .filter-tab-pill {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .filter-tab-pill:hover {
          color: var(--primary-teal);
        }

        .filter-tab-pill.active {
          background: white;
          color: var(--primary-teal);
          box-shadow: 0 2px 8px rgba(0, 151, 167, 0.15);
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: white;
          border: 2px solid rgba(0, 151, 167, 0.2);
          border-radius: var(--radius-md);
        }

        .search-input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 0.9rem;
        }

        .flex-grow-1 {
          flex-grow: 1;
        }

        .table-section {
          padding: var(--spacing-lg);
        }

        .row-expired {
          background: rgba(198, 40, 40, 0.04);
        }

        .row-expired:hover {
          background: rgba(198, 40, 40, 0.08) !important;
        }

        .med-details-cell {
          display: flex;
          flex-direction: column;
        }

        .med-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .med-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .batch-badge {
          background: rgba(21, 101, 192, 0.1);
          color: var(--primary-blue);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .expiry-date-cell {
          display: flex;
          flex-direction: column;
        }

        .expiry-countdown {
          font-size: 0.72rem;
          font-weight: 500;
          margin-top: 2px;
        }

        .expiry-countdown.soon {
          color: var(--error);
          font-weight: 600;
        }

        .expiry-countdown.ok {
          color: var(--text-muted);
        }

        .location-cell, .supplier-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .supplier-cell {
          max-width: 160px;
        }

        .supplier-wrapper span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .font-weight-600 {
          font-weight: 600;
        }

        .mr-sm {
          margin-right: var(--spacing-sm);
        }

        .input-helper-text {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 4px;
          line-height: 1.3;
        }

        /* Modal styling */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          padding: var(--spacing-xl);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .modal-header h2 {
          font-size: 1.3rem;
          color: var(--text-primary);
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.8rem;
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
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-md);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          .header-actions {
            width: 100%;
          }
          .header-actions button {
            flex: 1;
          }
          .filter-bar-card {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-pill-selector {
            justify-content: center;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Inventory;
