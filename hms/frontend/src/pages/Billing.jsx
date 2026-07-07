import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { DollarSign, Plus, Search, FileText, CreditCard, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billToEdit, setBillToEdit] = useState(null);

  useEffect(() => {
    fetchBills();
  }, [searchTerm]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/billing?search=${searchTerm}`);
      setBills(response.data.data.bills);
    } catch (error) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': 'warning',
      'Partial': 'info',
      'Paid': 'success',
      'Cancelled': 'error',
      'Refunded': 'muted'
    };
    return badges[status] || 'primary';
  };

  const handleDeleteBill = async (billId, billNum) => {
    if (window.confirm(`Are you sure you want to delete invoice ${billNum}? This action cannot be undone.`)) {
      try {
        await api.delete(`/billing/${billId}`);
        toast.success('Invoice deleted successfully');
        fetchBills();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Billing</h1>
            <p className="page-subtitle">Manage invoices and payments</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Generate Invoice
          </button>
        </header>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-green">
              <DollarSign size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                LKR {bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + parseFloat(b.paid_amount || 0), 0).toFixed(2)}
              </div>
              <div className="stat-label">Collected</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-orange">
              <FileText size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{bills.filter(b => b.status === 'Pending').length}</div>
              <div className="stat-label">Pending Bills</div>
            </div>
          </div>
        </section>

        {/* Search */}
        <div className="search-bar glass-card">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by bill number or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Bills Table */}
        <div className="glass-card table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} color="var(--text-muted)" />
              <p>No bills found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bill Number</th>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.bill_id}>
                      <td className="code-cell">{bill.bill_number}</td>
                      <td>
                        <div>
                          <div className="name-primary">{bill.patient_name}</div>
                          <div className="name-secondary">{bill.patient_code}</div>
                        </div>
                      </td>
                      <td>{new Date(bill.bill_date).toLocaleDateString()}</td>
                      <td>LKR {parseFloat(bill.final_amount).toFixed(2)}</td>
                      <td className="text-success">LKR {parseFloat(bill.paid_amount || 0).toFixed(2)}</td>
                      <td className={parseFloat(bill.final_amount) - parseFloat(bill.paid_amount || 0) > 0 ? 'text-error' : ''}>
                        LKR {(parseFloat(bill.final_amount) - parseFloat(bill.paid_amount || 0)).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedBill(bill);
                              setShowPaymentModal(true);
                            }}
                            disabled={bill.status === 'Paid'}
                          >
                            <CreditCard size={16} />
                            Pay
                          </button>
                          <button className="btn-icon" onClick={() => { setBillToEdit(bill); setShowEditModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <Edit size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => handleDeleteBill(bill.bill_id, bill.bill_number)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
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

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <PaymentModal
          bill={selectedBill}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedBill(null);
            fetchBills();
          }}
        />
      )}

      {/* Generate Invoice Modal */}
      {showModal && (
        <GenerateInvoiceModal
          onClose={() => {
            setShowModal(false);
            fetchBills();
          }}
        />
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && billToEdit && (
        <EditInvoiceModal
          bill={billToEdit}
          onClose={() => {
            setShowEditModal(false);
            setBillToEdit(null);
            fetchBills();
          }}
        />
      )}

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: var(--background);
        }

        .search-bar {
          display: flex;
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: white;
          border: 2px solid rgba(0, 151, 167, 0.2);
          border-radius: var(--radius-md);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1rem;
        }

        .table-section {
          padding: var(--spacing-lg);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }

        .code-cell {
          font-weight: 600;
          color: var(--primary-teal);
        }

        .name-primary {
          font-weight: 500;
        }

        .name-secondary {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

const GenerateInvoiceModal = ({ onClose }) => {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [discountVal, setDiscountVal] = useState('0.00');
  const [taxVal, setTaxVal] = useState('0.00');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    const date = new Date();
    date.setDate(date.getDate() + 14);
    setDueDate(date.toISOString().split('T')[0]);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data.data?.patients || []);
    } catch (error) {
      console.error('Failed to load patients', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/billing', {
        patientId: parseInt(patientId),
        totalAmount: parseFloat(totalAmount),
        discountAmount: parseFloat(discountVal || 0.00),
        taxAmount: parseFloat(taxVal || 0.00),
        dueDate,
        notes
      });
      toast.success('Invoice generated successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = parseFloat(totalAmount || 0) - parseFloat(discountVal || 0) + parseFloat(taxVal || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate New Invoice</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Select Patient *</label>
            <select
              className="form-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              <option value="">-- Select Patient --</option>
              {patients.map(p => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name || `${p.first_name} ${p.last_name}`} ({p.patient_code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Base Amount (LKR) *</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                placeholder="e.g. 5000.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Amount (LKR)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tax Amount (LKR)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={taxVal}
                onChange={(e) => setTaxVal(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Itemization & Notes</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="e.g. General consultation fees, Lab tests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="final-calculation-banner">
            <span>Computed Final Amount:</span>
            <strong>LKR {finalAmount.toFixed(2)}</strong>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Invoice'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #e5e7eb !important;
          border: 2px solid #9ca3af !important;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 550px;
          padding: var(--spacing-xl);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          color: #000000 !important;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid #d1d5db;
          padding-bottom: var(--spacing-sm);
        }
        .modal-header h2 {
          color: #000000 !important;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          color: #4b5563 !important;
          line-height: 1;
        }
        .btn-close:hover {
          color: #000000 !important;
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
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #000000 !important;
        }
        .form-input, .form-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid #9ca3af !important;
          background: #ffffff !important;
          color: #000000 !important;
          border-radius: var(--radius-md);
          font-size: 1rem;
          outline: none;
        }
        .form-input:focus, .form-select:focus {
          border-color: #000000 !important;
        }
        .final-calculation-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: #d1d5db !important;
          border: 1px solid #9ca3af;
          border-radius: var(--radius-md);
          margin-top: var(--spacing-xs);
          color: #000000 !important;
        }
        .final-calculation-banner span {
          font-weight: 600;
        }
        .final-calculation-banner strong {
          font-size: 1.25rem;
          font-weight: 800;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          border-top: 1px solid #d1d5db;
          padding-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
};

const PaymentModal = ({ bill, onClose }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/billing/payment', {
        billId: bill.bill_id,
        amount: parseFloat(amount),
        paymentMethod,
        paymentReference: ''
      });
      toast.success('Payment recorded successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const balance = parseFloat(bill.final_amount) - parseFloat(bill.paid_amount || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Make Payment</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="bill-summary">
          <div className="summary-row">
            <span>Bill Number:</span>
            <strong>{bill.bill_number}</strong>
          </div>
          <div className="summary-row">
            <span>Patient:</span>
            <strong>{bill.patient_name}</strong>
          </div>
          <div className="summary-row">
            <span>Total Amount:</span>
            <strong>LKR {parseFloat(bill.final_amount).toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Paid:</span>
            <strong className="text-success">LKR {parseFloat(bill.paid_amount || 0).toFixed(2)}</strong>
          </div>
          <div className="summary-row balance">
            <span>Balance Due:</span>
            <strong className="text-error">LKR {balance.toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label className="form-label">Payment Amount (LKR)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={balance}
              step="0.01"
              placeholder={`Max: LKR ${balance.toFixed(2)}`}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Insurance">Insurance</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Online">Online</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: #e5e7eb !important;
          border: 2px solid #9ca3af !important;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          padding: var(--spacing-xl);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          color: #000000 !important;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          border-bottom: 1px solid #d1d5db;
          padding-bottom: var(--spacing-sm);
        }
        .modal-header h2 {
          color: #000000 !important;
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.75rem;
          cursor: pointer;
          color: #4b5563 !important;
          line-height: 1;
        }
        .btn-close:hover {
          color: #000000 !important;
        }
        .bill-summary {
          background: #d1d5db !important;
          border: 1px solid #9ca3af;
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          color: #000000 !important;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.95rem;
        }
        .summary-row strong {
          color: #000000 !important;
        }
        .summary-row.balance {
          border-top: 1px solid #9ca3af;
          padding-top: var(--spacing-xs);
          margin-top: var(--spacing-xs);
          font-weight: 700;
        }
        .payment-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #000000 !important;
        }
        .form-input, .form-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid #9ca3af !important;
          background: #ffffff !important;
          color: #000000 !important;
          border-radius: var(--radius-md);
          font-size: 1rem;
          outline: none;
        }
        .form-input:focus, .form-select:focus {
          border-color: #000000 !important;
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-md);
          border-top: 1px solid #d1d5db;
          padding-top: var(--spacing-md);
        }
      `}</style>
    </div>
  );
};

const EditInvoiceModal = ({ bill, onClose }) => {
  const [totalAmount, setTotalAmount] = useState(bill.total_amount || '');
  const [discountVal, setDiscountVal] = useState(bill.discount_amount || '0.00');
  const [taxVal, setTaxVal] = useState(bill.tax_amount || '0.00');
  const [dueDate, setDueDate] = useState(bill.due_date ? bill.due_date.split('T')[0] : '');
  const [notes, setNotes] = useState(bill.notes || '');
  const [status, setStatus] = useState(bill.status || 'Pending');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/billing/${bill.bill_id}`, {
        totalAmount: parseFloat(totalAmount),
        discountAmount: parseFloat(discountVal || 0.00),
        taxAmount: parseFloat(taxVal || 0.00),
        dueDate,
        notes,
        status
      });
      toast.success('Invoice updated successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  const finalAmount = parseFloat(totalAmount || 0) - parseFloat(discountVal || 0) + parseFloat(taxVal || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Invoice {bill.bill_number}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Base Amount (LKR) *</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Amount (LKR)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tax Amount (LKR)</label>
              <input
                type="number"
                className="form-input"
                min="0"
                step="0.01"
                value={taxVal}
                onChange={(e) => setTaxVal(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} required>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Due Date *</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Notes</label>
            <textarea
              className="form-input"
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="final-calculation-banner">
            <span>Computed Final Amount:</span>
            <strong>LKR {finalAmount.toFixed(2)}</strong>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Billing;

