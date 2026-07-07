import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { Calendar, Clock, Plus, Search, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentType: 'Consultation',
    symptoms: ''
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch appointments
      const aptRes = await api.get(filterStatus ? `/appointments?status=${filterStatus}` : '/appointments');
      setAppointments(aptRes.data.data?.appointments || []);

      // Fetch doctors
      const docRes = await api.get('/doctors');
      setDoctors(docRes.data.data || []);

      // Fetch patients (handle different response structures)
      const patRes = await api.get('/patients');
      const patientsData = patRes.data.data?.patients || patRes.data.data || [];
      setPatients(patientsData);

    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.appointmentTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const submitData = {
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        appointmentType: formData.appointmentType,
        symptoms: formData.symptoms || null,
        createdBy: 9 // Receptionist ID
      };

      const response = await api.post('/appointments', submitData);

      if (response.data.success) {
        toast.success('Appointment booked successfully');
        setShowModal(false);
        resetForm();
        fetchData(); // Refresh the appointments list
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      appointmentDate: '',
      appointmentTime: '',
      appointmentType: 'Consultation',
      symptoms: ''
    });
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Pending': 'warning',
      'Confirmed': 'info',
      'In Progress': 'primary',
      'Completed': 'success',
      'Cancelled': 'error',
      'No-Show': 'error'
    };
    return badges[status] || 'primary';
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Appointments</h1>
            <p className="page-subtitle">Schedule and manage patient appointments</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Book Appointment
          </button>
        </header>

        {/* Filter */}
        <div className="filter-bar glass-card">
          <span className="filter-label">Filter by status:</span>
          <select
            className="form-select filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Appointments Grid */}
        <div className="appointments-grid">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="empty-state glass-card">
              <Calendar size={48} color="var(--text-muted)" />
              <p>No appointments found</p>
            </div>
          ) : (
            appointments.map((apt) => (
              <div key={apt.appointment_id} className="appointment-card glass-card">
                <div className="apt-header">
                  <div className="apt-date">
                    <Calendar size={20} />
                    <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <span className={`badge badge-${getStatusBadge(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>

                <div className="apt-body">
                  <div className="apt-row">
                    <Clock size={16} />
                    <span>{apt.appointment_time?.substring(0, 5)}</span>
                  </div>
                  <div className="apt-row">
                    <User size={16} />
                    <span>{apt.patient_name}</span>
                  </div>
                  <div className="apt-row">
                    <Stethoscope size={16} />
                    <span>Dr. {apt.doctor_name}</span>
                  </div>
                  <div className="apt-row">
                    <span className="apt-type">{apt.appointment_type}</span>
                  </div>
                  {apt.symptoms && (
                    <div className="apt-symptoms">
                      <strong>Symptoms:</strong> {apt.symptoms}
                    </div>
                  )}
                </div>

                <div className="apt-actions">
                  {apt.status === 'Pending' && (
                    <>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => updateStatus(apt.appointment_id, 'Confirmed')}
                      >
                        Confirm
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => updateStatus(apt.appointment_id, 'Cancelled')}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {apt.status === 'Confirmed' && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => updateStatus(apt.appointment_id, 'In Progress')}
                    >
                      Start
                    </button>
                  )}
                  {apt.status === 'In Progress' && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => updateStatus(apt.appointment_id, 'Completed')}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book New Appointment</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Patient Selection */}
              <div className="form-group">
                <label className="form-label">Patient *</label>
                <select
                  className="form-select"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.first_name} {p.last_name} ({p.patient_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Doctor Selection */}
              <div className="form-group">
                <label className="form-label">Doctor *</label>
                <select
                  className="form-select"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.doctor_id} value={d.doctor_id}>
                      Dr. {d.first_name} {d.last_name} - {d.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time Row */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Appointment Type */}
              <div className="form-group">
                <label className="form-label">Appointment Type</label>
                <select
                  className="form-select"
                  value={formData.appointmentType}
                  onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Checkup">Checkup</option>
                  <option value="Surgery">Surgery</option>
                </select>
              </div>

              {/* Symptoms */}
              <div className="form-group">
                <label className="form-label">Symptoms</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Describe patient symptoms..."
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                />
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Book Appointment
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

        .filter-bar {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .filter-label {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .filter-select {
          min-width: 200px;
        }

        .appointments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
        }

        .appointment-card {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .apt-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: var(--spacing-md);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .apt-date {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 500;
        }

        .apt-body {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .apt-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .apt-type {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .apt-symptoms {
          margin-top: var(--spacing-sm);
          padding: var(--spacing-sm);
          background: rgba(0, 0, 0, 0.03);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .apt-actions {
          display: flex;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }

        /* Modal */
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
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          padding: var(--spacing-xl);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
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

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--spacing-md);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
};

export default Appointments;
