import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { BarChart3, TrendingUp, Users, Pill, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('revenue');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, [activeReport, dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      let endpoint;
      switch (activeReport) {
        case 'revenue':
          endpoint = `/reports/revenue?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'patient-load':
          endpoint = '/reports/patient-load';
          break;
        case 'inventory':
          endpoint = '/reports/inventory';
          break;
        case 'appointments':
          endpoint = `/reports/appointments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        case 'demographics':
          endpoint = `/reports/demographics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
          break;
        default:
          return;
      }

      const response = await api.get(endpoint);
      setReportData(response.data.data);
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const reports = [
    { id: 'revenue', name: 'Revenue Report', icon: TrendingUp },
    { id: 'patient-load', name: 'Patient Load', icon: Users },
    { id: 'inventory', name: 'Inventory Status', icon: Pill },
    { id: 'appointments', name: 'Appointments', icon: FileText },
    { id: 'demographics', name: 'Demographics', icon: BarChart3 }
  ];

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">View analytics and generate reports</p>
          </div>
        </header>

        {/* Report Selection */}
        <div className="reports-tabs glass-card">
          {reports.map((report) => (
            <button
              key={report.id}
              className={`report-tab ${activeReport === report.id ? 'active' : ''}`}
              onClick={() => setActiveReport(report.id)}
            >
              <report.icon size={20} />
              <span>{report.name}</span>
            </button>
          ))}
        </div>

        {/* Date Range Filter */}
        {(activeReport === 'revenue' || activeReport === 'appointments' || activeReport === 'demographics') && (
          <div className="date-filter glass-card">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" onClick={fetchReport}>
              Apply
            </button>
          </div>
        )}

        {/* Report Content */}
        <div className="glass-card report-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading report...</p>
            </div>
          ) : (
            <ReportView reportType={activeReport} data={reportData} />
          )}
        </div>
      </main>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          background: var(--background);
        }

        .reports-tabs {
          display: flex;
          gap: var(--spacing-sm);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
        }

        .report-tab {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-lg);
          border: 2px solid transparent;
          background: rgba(0, 151, 167, 0.05);
          color: var(--text-secondary);
          font-weight: 500;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .report-tab:hover {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
        }

        .report-tab.active {
          background: var(--gradient-primary);
          color: white;
        }

        .date-filter {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          align-items: flex-end;
        }

        .report-content {
          padding: var(--spacing-xl);
          min-height: 400px;
        }

        .loading-state {
          text-align: center;
          padding: var(--spacing-xxl);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

const ReportView = ({ reportType, data }) => {
  if (!data) {
    return <div className="empty-message">No data available</div>;
  }

  switch (reportType) {
    case 'revenue':
      return (
        <div className="report-table">
          <h3>Revenue Report</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bills</th>
                <th>Daily Total</th>
                <th>Cumulative</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{new Date(row.report_date).toLocaleDateString()}</td>
                  <td>{row.bill_count}</td>
                  <td>LKR {parseFloat(row.daily_total).toFixed(2)}</td>
                  <td>LKR {parseFloat(row.cumulative_revenue).toFixed(2)}</td>
                  <td className={row.day_over_day_change >= 0 ? 'text-success' : 'text-error'}>
                    {row.day_over_day_change >= 0 ? '+' : ''}{row.day_over_day_pct?.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'patient-load':
      return (
        <div className="report-table">
          <h3>Patient Load by Doctor</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Completed</th>
                <th>Pending</th>
                <th>Total</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.doctor_name}</td>
                  <td>{row.specialization}</td>
                  <td>{row.department || 'N/A'}</td>
                  <td>{row.completed_appointments}</td>
                  <td>{row.pending_appointments}</td>
                  <td>{row.total_appointments}</td>
                  <td>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${row.completion_rate}%` }}
                      />
                      <span>{row.completion_rate?.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'inventory':
      return (
        <div className="report-table">
          <h3>Inventory Status Report</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Reorder Level</th>
                <th>Earliest Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.medicine_name}</td>
                  <td>{row.category_name || 'N/A'}</td>
                  <td>{row.total_stock || 0}</td>
                  <td>{row.reorder_level}</td>
                  <td>{row.earliest_expiry ? new Date(row.earliest_expiry).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${row.status === 'OK' ? 'success' : row.status === 'LOW STOCK' ? 'warning' : 'error'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'appointments':
      return (
        <div className="report-table">
          <h3>Appointments Report</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>Total</th>
                <th>Completed</th>
                <th>Cancelled</th>
                <th>No-Show</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.doctor_name}</td>
                  <td>{row.specialization}</td>
                  <td>{row.department || 'N/A'}</td>
                  <td>{row.total_appointments}</td>
                  <td>{row.completed}</td>
                  <td>{row.cancelled}</td>
                  <td>{row.no_show}</td>
                  <td>{row.completion_rate?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'demographics':
      return (
        <div className="demographics-grid">
          <div className="demo-section">
            <h4>Age Distribution</h4>
            {data.ageDistribution?.map((row, i) => (
              <div key={i} className="demo-bar">
                <span className="demo-label">{row.age_group}</span>
                <div className="demo-bar-bg">
                  <div className="demo-bar-fill" style={{ width: `${(row.patient_count / Math.max(...data.ageDistribution.map(d => d.patient_count))) * 100}%` }} />
                </div>
                <span className="demo-value">{row.patient_count}</span>
              </div>
            ))}
          </div>
          <div className="demo-section">
            <h4>Gender Distribution</h4>
            {data.genderDistribution?.map((row, i) => (
              <div key={i} className="demo-bar">
                <span className="demo-label">{row.gender}</span>
                <div className="demo-bar-bg">
                  <div className="demo-bar-fill" style={{ width: `${(row.patient_count / Math.max(...data.genderDistribution.map(d => d.patient_count))) * 100}%` }} />
                </div>
                <span className="demo-value">{row.patient_count}</span>
              </div>
            ))}
          </div>
          <div className="demo-section">
            <h4>Blood Group Distribution</h4>
            <div className="blood-grid">
              {data.bloodGroupDistribution?.map((row, i) => (
                <div key={i} className="blood-badge-large">
                  <span>{row.blood_group}</span>
                  <small>{row.patient_count}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return <div className="empty-message">Select a report to view</div>;
  }
};

export default Reports;
