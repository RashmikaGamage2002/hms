import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Calendar, Clock, User, Stethoscope, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MySchedule = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchMyAppointments();
  }, [selectedDate]);

  const fetchMyAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments?doctor_id=${user?.id}&date=${selectedDate}`);
      setAppointments(response.data.data?.appointments || []);
    } catch (error) {
      toast.error('Failed to load schedule');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchMyAppointments();
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
            <h1 className="page-title">My Schedule</h1>
            <p className="page-subtitle">View and manage your appointments</p>
          </div>
          <div className="date-picker">
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </header>

        {/* Schedule Stats */}
        <section className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-teal">
              <Calendar size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{appointments.length}</div>
              <div className="stat-label">Total Appointments</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-blue">
              <Clock size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {appointments.filter(a => a.status === 'Completed').length}
              </div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card glass-card">
            <div className="stat-icon stat-icon-orange">
              <Clock size={28} />
            </div>
            <div className="stat-content">
              <div className="stat-value">
                {appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length}
              </div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
        </section>

        {/* Appointments List */}
        <div className="glass-card appointments-section">
          <h2 className="section-title">
            Appointments for {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading schedule...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} color="var(--text-muted)" />
              <p>No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="schedule-timeline">
              {appointments.map((apt) => (
                <div key={apt.appointment_id} className="schedule-card">
                  <div className="schedule-time">
                    <Clock size={20} />
                    <span>{apt.appointment_time?.substring(0, 5)}</span>
                  </div>
                  <div className="schedule-info">
                    <div className="patient-info">
                      <User size={18} />
                      <span className="patient-name">{apt.patient_name}</span>
                      <span className="patient-code">{apt.patient_code}</span>
                    </div>
                    <div className="appointment-type">
                      <Stethoscope size={18} />
                      <span>{apt.appointment_type}</span>
                    </div>
                    {apt.symptoms && (
                      <div className="symptoms">
                        <strong>Symptoms:</strong> {apt.symptoms}
                      </div>
                    )}
                  </div>
                  <div className="schedule-status">
                    <span className={`badge badge-${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="schedule-actions">
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
                    {(apt.status === 'Pending' || apt.status === 'Confirmed') && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => updateStatus(apt.appointment_id, 'Cancelled')}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: var(--background);
        }

        .date-picker {
          min-width: 200px;
        }

        .date-picker input {
          background: white;
          border: 2px solid rgba(0, 151, 167, 0.2);
          border-radius: var(--radius-md);
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.9rem;
        }

        .appointments-section {
          padding: var(--spacing-lg);
        }

        .section-title {
          font-size: 1.25rem;
          margin-bottom: var(--spacing-lg);
          color: var(--text-primary);
        }

        .schedule-timeline {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .schedule-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all var(--transition-fast);
        }

        .schedule-card:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
        }

        .schedule-time {
          min-width: 80px;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-weight: 600;
          color: var(--primary-teal);
        }

        .schedule-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .patient-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .patient-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .patient-code {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }

        .appointment-type {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .symptoms {
          margin-top: var(--spacing-xs);
          font-size: 0.8rem;
          color: var(--text-muted);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: rgba(0, 0, 0, 0.3);
          border-radius: var(--radius-sm);
        }

        .schedule-status {
          min-width: 100px;
        }

        .schedule-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .schedule-card {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .schedule-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};

export default MySchedule;