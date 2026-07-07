import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';  // ← Fix import path
import { Users, Plus, Search, Filter, Edit, Trash2, FileText, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nic: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: 'A+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Spouse'
  });

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients?search=${searchTerm}`);
      // Backend returns { success, data: { patients, pagination } }
      setPatients(response.data.data?.patients || []);
    } catch (error) {
      toast.error('Failed to load patients');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert empty strings to null for SQL
      const submitData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        nic: formData.nic,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        blood_group: formData.bloodGroup || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        emergency_contact_relation: formData.emergencyContactRelation || null
      };

      await api.post('/patients', submitData);
      toast.success('Patient registered successfully');
      setShowModal(false);
      fetchPatients();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register patient');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      nic: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      gender: 'Male',
      bloodGroup: 'A+',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: 'Spouse'
    });
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setEditFormData({
      firstName: patient.first_name || '',
      lastName: patient.last_name || '',
      nic: patient.nic || '',
      email: patient.email || '',
      phone: patient.phone || '',
      address: patient.address || '',
      dateOfBirth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      gender: patient.gender || 'Male',
      bloodGroup: patient.blood_group || 'A+',
      emergencyContactName: patient.emergency_contact_name || '',
      emergencyContactPhone: patient.emergency_contact_phone || '',
      emergencyContactRelation: patient.emergency_contact_relation || 'Spouse'
    });
    setShowEditModal(true);
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        first_name: editFormData.firstName,
        last_name: editFormData.lastName,
        nic: editFormData.nic,
        email: editFormData.email,
        phone: editFormData.phone || null,
        address: editFormData.address || null,
        blood_group: editFormData.bloodGroup || null,
        emergency_contact_name: editFormData.emergencyContactName || null,
        emergency_contact_phone: editFormData.emergencyContactPhone || null
      };
      await api.put(`/patients/${selectedPatient.patient_id}`, submitData);
      toast.success('Patient updated successfully');
      setShowEditModal(false);
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update patient');
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (window.confirm(`Are you sure you want to deactivate ${patientName}?`)) {
      try {
        await api.delete(`/patients/${patientId}`);
        toast.success('Patient deactivated');
        fetchPatients();
      } catch (error) {
        toast.error('Failed to deactivate patient');
      }
    }
  };

  const handleActivatePatient = async (patientId, patientName) => {
    if (window.confirm(`Are you sure you want to reactivate ${patientName}?`)) {
      try {
        await api.patch(`/patients/${patientId}/activate`);
        toast.success('Patient reactivated');
        fetchPatients();
      } catch (error) {
        toast.error('Failed to reactivate patient');
      }
    }
  };

  const getStatusBadge = (isActive) => isActive ? 'success' : 'muted';

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-subtitle">Manage patient registrations and records</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Register Patient
          </button>
        </header>

        {/* Search and Filter */}
        <div className="search-bar glass-card">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name, NIC, or patient code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter size={20} />
            Filter
          </button>
        </div>

        {/* Patients Table */}
        <div className="glass-card table-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <Users size={48} color="var(--text-muted)" />
              <p>No patients found</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>NIC</th>
                    <th>Age</th>
                    <th>Gender</th>
                    <th>Blood Group</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td className="code-cell">{patient.patient_code}</td>
                      <td>
                        <div className="name-cell">
                          <span className="name-primary">
                            {patient.full_name || `${patient.first_name} ${patient.last_name}`}
                          </span>
                        </div>
                      </td>
                      <td>{patient.nic}</td>
                      <td>{patient.age || '-'}</td>
                      <td>{patient.gender}</td>
                      <td>
                        <span className="blood-badge">{patient.blood_group || 'N/A'}</span>
                      </td>
                      <td>{patient.phone || '-'}</td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(patient.is_active)}`}>
                          {patient.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon" title="View Details" onClick={() => handleViewPatient(patient)}>
                            <FileText size={18} />
                          </button>
                          <button className="btn-icon" title="Edit" onClick={() => handleEditPatient(patient)}>
                            <Edit size={18} />
                          </button>
                          {patient.is_active ? (
                            <button className="btn-icon" title="Deactivate" style={{ color: 'var(--error)' }} onClick={() => handleDeletePatient(patient.patient_id, patient.first_name)}>
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button className="btn-icon" title="Reactivate" style={{ color: 'var(--success)' }} onClick={() => handleActivatePatient(patient.patient_id, patient.first_name)}>
                              <UserCheck size={18} />
                            </button>
                          )}
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

      {/* Register Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register New Patient</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-section-title">Emergency Contact</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Relation</label>
                  <select
                    className="form-select"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Patient Modal */}
      {showViewModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Patient Details</h2>
              <button className="btn-close" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div>{selectedPatient.full_name || `${selectedPatient.first_name} ${selectedPatient.last_name}`}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Code</label>
                  <div>{selectedPatient.patient_code}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC</label>
                  <div>{selectedPatient.nic}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Age / Gender</label>
                  <div>{selectedPatient.age || '-'} / {selectedPatient.gender}</div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <div>{selectedPatient.blood_group || 'N/A'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact</label>
                  <div>{selectedPatient.phone || '-'} / {selectedPatient.email}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <div>{selectedPatient.address || '-'}</div>
              </div>
              
              <div className="form-section-title">Emergency Contact</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <div>{selectedPatient.emergency_contact_name || '-'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <div>{selectedPatient.emergency_contact_phone || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Patient</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdatePatient} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.nic}
                    onChange={(e) => setEditFormData({ ...editFormData, nic: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={editFormData.bloodGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>

              <div className="form-section-title">Emergency Contact</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editFormData.emergencyContactName}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={editFormData.emergencyContactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Patient
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

        .search-bar {
          display: flex;
          gap: var(--spacing-md);
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

        .name-cell {
          display: flex;
          flex-direction: column;
        }

        .name-primary {
          font-weight: 500;
        }

        .blood-badge {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(198, 40, 40, 0.1);
          color: var(--error);
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.8rem;
        }

        .action-buttons {
          display: flex;
          gap: var(--spacing-sm);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-sm);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .btn-icon:hover {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
        }

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

        .btn-close:hover {
          color: var(--text-primary);
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

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Patients;