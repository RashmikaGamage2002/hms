import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { Stethoscope, Plus, Search, Mail, Phone, Calendar, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [departments, setDepartments] = useState([]);
  const [newDoctor, setNewDoctor] = useState({
    first_name: '',
    last_name: '',
    nic: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'Male',
    specialization: '',
    license_number: '',
    years_experience: '',
    consultation_fee: '',
    is_department_head: false,
    department_id: '',
    image_url: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, [searchTerm]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors?search=${searchTerm}`);
      setDoctors(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        first_name: newDoctor.first_name,
        last_name: newDoctor.last_name,
        nic: newDoctor.nic,
        email: newDoctor.email,
        phone: newDoctor.phone || null,
        address: newDoctor.address || null,
        date_of_birth: newDoctor.date_of_birth,
        gender: newDoctor.gender,
        specialization: newDoctor.specialization,
        license_number: newDoctor.license_number,
        years_experience: newDoctor.years_experience ? parseInt(newDoctor.years_experience) : 0,
        consultation_fee: newDoctor.consultation_fee ? parseFloat(newDoctor.consultation_fee) : 0.00,
        is_department_head: newDoctor.is_department_head,
        department_id: newDoctor.department_id || null,
        image_url: newDoctor.image_url || null
      };

      await api.post('/doctors', submitData);
      toast.success('Doctor registered successfully');
      setShowModal(false);
      resetDoctorForm();
      fetchDoctors();
    } catch (error) {
      console.error('Error adding doctor:', error);
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    }
  };

  const resetDoctorForm = () => {
    setNewDoctor({
      first_name: '',
      last_name: '',
      nic: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      gender: 'Male',
      specialization: '',
      license_number: '',
      years_experience: '',
      consultation_fee: '',
      is_department_head: false,
      department_id: '',
      image_url: ''
    });
  };

  const handleDoctorChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDoctor({
      ...newDoctor,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditDoctorChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setEditFormData({
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      nic: doctor.nic || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      address: doctor.address || '',
      date_of_birth: doctor.date_of_birth ? doctor.date_of_birth.split('T')[0] : '',
      gender: doctor.gender || 'Male',
      specialization: doctor.specialization || '',
      license_number: doctor.license_number || '',
      years_experience: doctor.years_experience || '',
      consultation_fee: doctor.consultation_fee || '',
      is_department_head: doctor.is_department_head === 1,
      department_id: doctor.department_id || '',
      image_url: doctor.image_url || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/doctors/${selectedDoctor.doctor_id}`, editFormData);
      toast.success('Doctor updated successfully');
      setShowEditModal(false);
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    }
  };

  const handleDeleteDoctor = async (doctorId, doctorName) => {
    if (window.confirm(`Are you sure you want to delete Dr. ${doctorName}?`)) {
      try {
        await api.delete(`/doctors/${doctorId}`);
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } catch (error) {
        toast.error('Failed to delete doctor');
      }
    }
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Doctors</h1>
            <p className="page-subtitle">Manage doctors and specializations</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Doctor
          </button>
        </header>

        {/* Search */}
        <div className="search-bar glass-card">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="doctors-grid">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="empty-state glass-card">
              <Stethoscope size={48} color="var(--text-muted)" />
              <p>No doctors found</p>
            </div>
          ) : (
            doctors.map((doctor) => (
              <div key={doctor.doctor_id} className="doctor-card glass-card">
                <div className="doctor-avatar">
                  {doctor.image_url ? (
                    <>
                      <img 
                        src={doctor.image_url} 
                        alt={`Dr. ${doctor.last_name}`} 
                        className="doctor-avatar-img" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.parentNode.querySelector('.avatar-placeholder');
                          if (fallback) fallback.style.display = 'inline';
                        }}
                      />
                      <span className="avatar-placeholder" style={{ display: 'none' }}>
                        {doctor.first_name ? doctor.first_name.charAt(0) : ''}{doctor.last_name ? doctor.last_name.charAt(0) : ''}
                      </span>
                    </>
                  ) : (
                    <span className="avatar-placeholder">
                      {doctor.first_name ? doctor.first_name.charAt(0) : ''}{doctor.last_name ? doctor.last_name.charAt(0) : ''}
                    </span>
                  )}
                </div>
                <div className="doctor-info">
                  <h3>Dr. {doctor.first_name} {doctor.last_name}</h3>
                  <p className="specialization">{doctor.specialization}</p>
                  {doctor.department && (
                    <span className="department-badge">{doctor.department}</span>
                  )}
                </div>
                <div className="doctor-details">
                  <div className="detail-row">
                    <Mail size={16} />
                    <span>{doctor.email}</span>
                  </div>
                  <div className="detail-row">
                    <Phone size={16} />
                    <span>{doctor.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <Calendar size={16} />
                    <span>{doctor.years_experience} years exp.</span>
                  </div>
                </div>
                <div className="doctor-footer">
                  <span className="consultation-fee">
                    LKR {parseFloat(doctor.consultation_fee).toFixed(2)} / consultation
                  </span>
                  {doctor.is_department_head && (
                    <span className="badge badge-primary" style={{ marginRight: 'auto', marginLeft: '10px' }}>Head</span>
                  )}
                  <div className="doctor-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-icon" title="Edit" onClick={() => handleEditDoctor(doctor)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Edit size={18} />
                    </button>
                    <button className="btn-icon" title="Delete" onClick={() => handleDeleteDoctor(doctor.doctor_id, doctor.last_name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add Doctor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content add-doctor-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Add New Doctor</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddDoctor} className="modal-form">
              <div className="form-section-title">Personal Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-input"
                    value={newDoctor.first_name}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-input"
                    value={newDoctor.last_name}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC *</label>
                  <input
                    type="text"
                    name="nic"
                    className="form-input"
                    value={newDoctor.nic}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={newDoctor.email}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-input"
                    value={newDoctor.phone}
                    onChange={handleDoctorChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={newDoctor.gender}
                    onChange={handleDoctorChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className="form-input"
                    value={newDoctor.date_of_birth}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={newDoctor.address}
                    onChange={handleDoctorChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Profile Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    className="form-input"
                    placeholder="Enter image URL (e.g., https://example.com/doctor.jpg)"
                    value={newDoctor.image_url}
                    onChange={handleDoctorChange}
                  />
                </div>
              </div>

              <div className="form-section-title">Professional Details</div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    name="specialization"
                    className="form-input"
                    value={newDoctor.specialization}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input
                    type="text"
                    name="license_number"
                    className="form-input"
                    value={newDoctor.license_number}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input
                    type="number"
                    name="years_experience"
                    className="form-input"
                    value={newDoctor.years_experience}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee (LKR) *</label>
                  <input
                    type="number"
                    name="consultation_fee"
                    className="form-input"
                    step="0.01"
                    value={newDoctor.consultation_fee}
                    onChange={handleDoctorChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department_id"
                    className="form-select"
                    value={newDoctor.department_id}
                    onChange={handleDoctorChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.dept_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="checkbox-label" style={{ marginTop: '1.5rem' }}>
                    <input
                      type="checkbox"
                      name="is_department_head"
                      checked={newDoctor.is_department_head}
                      onChange={handleDoctorChange}
                    />
                    Is Department Head
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && selectedDoctor && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content add-doctor-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Edit Doctor</h2>
              <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateDoctor} className="modal-form">
              <div className="form-section-title">Personal Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-input"
                    value={editFormData.first_name}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-input"
                    value={editFormData.last_name}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">NIC *</label>
                  <input
                    type="text"
                    name="nic"
                    className="form-input"
                    value={editFormData.nic}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    value={editFormData.email}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-input"
                    value={editFormData.phone}
                    onChange={handleEditDoctorChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={editFormData.gender}
                    onChange={handleEditDoctorChange}
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className="form-input"
                    value={editFormData.date_of_birth}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={editFormData.address}
                    onChange={handleEditDoctorChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Profile Image URL</label>
                  <input
                    type="text"
                    name="image_url"
                    className="form-input"
                    placeholder="Enter image URL (e.g., https://example.com/doctor.jpg)"
                    value={editFormData.image_url}
                    onChange={handleEditDoctorChange}
                  />
                </div>
              </div>
              <div className="form-section-title">Professional Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Specialization *</label>
                  <input
                    type="text"
                    name="specialization"
                    className="form-input"
                    value={editFormData.specialization}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">License Number *</label>
                  <input
                    type="text"
                    name="license_number"
                    className="form-input"
                    value={editFormData.license_number}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input
                    type="number"
                    name="years_experience"
                    className="form-input"
                    value={editFormData.years_experience}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Consultation Fee (LKR) *</label>
                  <input
                    type="number"
                    name="consultation_fee"
                    className="form-input"
                    step="0.01"
                    value={editFormData.consultation_fee}
                    onChange={handleEditDoctorChange}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    name="department_id"
                    className="form-select"
                    value={editFormData.department_id}
                    onChange={handleEditDoctorChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id}>
                        {dept.dept_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="checkbox-label" style={{ marginTop: '1.5rem' }}>
                    <input
                      type="checkbox"
                      name="is_department_head"
                      checked={editFormData.is_department_head}
                      onChange={handleEditDoctorChange}
                    />
                    Is Department Head
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
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
          border-radius: var(--radius-lg);
        }

        .add-doctor-modal {
          background: #e5e7eb !important; /* Solid premium gray background */
          border: 2px solid #9ca3af !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        .add-doctor-modal h2 {
          color: #000000 !important;
          font-weight: 700 !important;
        }

        .add-doctor-modal .btn-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #000000 !important;
          cursor: pointer;
          line-height: 1;
          font-weight: 700 !important;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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

        .add-doctor-modal .form-label {
          font-size: 0.85rem;
          font-weight: 600 !important;
          color: #000000 !important;
        }

        .add-doctor-modal .form-input, 
        .add-doctor-modal .form-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid #9ca3af !important;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          background: white !important;
          color: #000000 !important;
        }

        .add-doctor-modal .form-input:focus, 
        .add-doctor-modal .form-select:focus {
          outline: none;
          border-color: #4b5563 !important;
        }

        .add-doctor-modal .form-section-title {
          font-weight: 700 !important;
          color: #000000 !important;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(0, 0, 0, 0.15) !important;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .add-doctor-modal .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
          color: #000000 !important;
          font-weight: 600 !important;
        }

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

        .doctors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .doctor-card {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .doctor-avatar {
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 auto;
          overflow: hidden;
        }

        .doctor-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: var(--radius-full);
        }

        .doctor-info {
          text-align: center;
        }

        .doctor-info h3 {
          font-size: 1.1rem;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .specialization {
          color: var(--primary-teal);
          font-weight: 500;
          font-size: 0.9rem;
          margin-bottom: var(--spacing-sm);
        }

        .department-badge {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(21, 101, 192, 0.1);
          color: var(--primary-blue);
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }

        .doctor-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: rgba(0, 151, 167, 0.03);
          border-radius: var(--radius-md);
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .doctor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .consultation-fee {
          font-weight: 600;
          color: var(--success);
        }

        .loading-state, .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: var(--spacing-xxl);
        }

        .page-placeholder {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
        }

        .page-placeholder h1 {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default Doctors;
