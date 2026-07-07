import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  Pill,
  Bed,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, appointmentsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/appointments/today')
      ]);

      setStats(summaryRes.data.data);
      setTodayAppointments(appointmentsRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'cancelled': return 'error';
      default: return 'primary';
    }
  };

  const getRoleSpecificStats = () => {
    if (!stats?.roleSpecific) return [];

    const roleStats = {
      Admin: [
        { label: 'Total Staff', value: stats.roleSpecific.total_staff, icon: Users, color: 'teal' },
        { label: 'Total Doctors', value: stats.roleSpecific.total_doctors, icon: Activity, color: 'blue' },
        { label: 'Pending Bills', value: stats.roleSpecific.pending_bills, icon: DollarSign, color: 'orange' },
        { label: "Today's Revenue", value: `LKR ${stats.roleSpecific.todays_revenue || 0}`, icon: TrendingUp, color: 'green' }
      ],
      Doctor: [
        { label: "Today's Appointments", value: stats.roleSpecific.todays_appointments, icon: Calendar, color: 'teal' },
        { label: 'Upcoming Appointments', value: stats.roleSpecific.upcoming_appointments, icon: Calendar, color: 'blue' }
      ],
      Pharmacist: [
        { label: 'Low Stock Items', value: stats.roleSpecific.low_stock_items, icon: AlertTriangle, color: 'orange' },
        { label: "Today's Dispensings", value: stats.roleSpecific.todays_dispensings, icon: Pill, color: 'teal' }
      ],
      Receptionist: [
        { label: 'Pending Appointments', value: stats.roleSpecific.pending_appointments, icon: Calendar, color: 'orange' },
        { label: "Today's Registrations", value: stats.roleSpecific.todays_registrations, icon: Users, color: 'teal' }
      ]
    };

    return roleStats[user?.role] || [];
  };

  const getCommonStats = () => {
    if (!stats?.common) return [];

    return [
      { label: 'Active Patients', value: stats.common.active_patients, icon: Users, color: 'green' },
      { label: "Today's Appointments", value: stats.common.todays_appointments, icon: Calendar, color: 'blue' },
      { label: 'Current Inpatients', value: stats.common.current_inpatients, icon: Bed, color: 'teal' }
    ];
  };

  const roleSpecificStats = getRoleSpecificStats();
  const commonStats = getCommonStats();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            {user?.role !== 'Doctor' && (
              <p className="page-subtitle">
                Welcome back, {user?.firstName} ({user?.role})
              </p>
            )}
          </div>
          <div className="header-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </header>

        {/* Common Stats */}
        <section className="stats-grid">
          {commonStats.map((stat, index) => (
            <div key={index} className="stat-card glass-card">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                <stat.icon size={28} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Role-specific Stats */}
        {roleSpecificStats.length > 0 && (
          <section className="stats-grid">
            {roleSpecificStats.map((stat, index) => (
              <div key={`role-${index}`} className="stat-card glass-card">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  <stat.icon size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Today's Appointments */}
        <section className="glass-card appointments-section">
          <div className="section-header">
            <h2>Today's Appointments</h2>
            <a href="/appointments" className="view-all-link">View All</a>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} color="var(--text-muted)" />
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((apt) => (
                    <tr key={apt.appointment_id}>
                      <td>{apt.appointment_time?.substring(0, 5)}</td>
                      <td>
                        <div className="patient-cell">
                          <span className="patient-code">{apt.patient_code}</span>
                          <span>{apt.patient_name}</span>
                        </div>
                      </td>
                      <td>Dr. {apt.doctor_name}</td>
                      <td>{apt.appointment_type}</td>
                      <td>
                        <span className={`badge badge-${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: var(--background);
        }

        .dashboard-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: var(--spacing-md);
          color: var(--text-secondary);
        }

        .header-date {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .appointments-section {
          padding: var(--spacing-lg);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .section-header h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .view-all-link {
          color: var(--primary-teal);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .view-all-link:hover {
          text-decoration: underline;
        }

        .empty-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-muted);
        }

        .patient-cell {
          display: flex;
          flex-direction: column;
        }

        .patient-code {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
