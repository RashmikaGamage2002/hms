import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  Bed,
  Plus,
  Search,
  Users,
  Compass,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  ArrowLeft,
  Briefcase,
  Layers,
  ClipboardCheck,
  Edit,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Wards = () => {
  const { user, isAdmin, isDoctor } = useAuth();

  // Dashboard & Ward states
  const [wards, setWards] = useState([]);
  const [stats, setStats] = useState({
    total_wards: 0,
    total_beds: 0,
    available_beds: 0,
    occupied_beds: 0,
    active_assignments: 0,
    avg_stay_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWardType, setSelectedWardType] = useState('');

  // Details view state
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedWardBeds, setSelectedWardBeds] = useState([]);
  const [loadingWardDetails, setLoadingWardDetails] = useState(false);

  // Modal states
  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [showEditWardModal, setShowEditWardModal] = useState(false);
  const [wardToEdit, setWardToEdit] = useState(null);
  const [editWardForm, setEditWardForm] = useState({});
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic lists
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [targetBed, setTargetBed] = useState(null);

  // Form states
  const [wardForm, setWardForm] = useState({
    wardName: '',
    wardType: 'General',
    floorNumber: '',
    totalBeds: '',
    departmentId: '',
    phone: ''
  });

  const [bedForm, setBedForm] = useState({
    wardId: '',
    bedNumber: '',
    bedType: 'General',
    floorPosition: ''
  });

  const [assignForm, setAssignForm] = useState({
    patientId: ''
  });

  const isStaff = user?.role === 'Admin' || user?.role === 'Receptionist' || user?.role === 'Doctor';
  const isReceptionist = user?.role === 'Receptionist';

  useEffect(() => {
    fetchWardsAndStats();
    fetchStaticLists();
  }, [searchTerm, selectedWardType]);

  // If a ward is currently selected, refresh its details
  useEffect(() => {
    if (selectedWard) {
      fetchWardDetails(selectedWard.ward_id);
    }
  }, [wards]);

  const fetchWardsAndStats = async () => {
    try {
      setLoading(true);
      let queryParams = [];
      if (selectedWardType) queryParams.push(`wardType=${selectedWardType}`);
      const queryStr = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const [wardsRes, statsRes] = await Promise.all([
        api.get(`/wards${queryStr}`),
        api.get('/wards/stats')
      ]);

      let data = wardsRes.data.data || [];
      if (searchTerm) {
        data = data.filter(w =>
          w.ward_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.department_name && w.department_name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      setWards(data);
      setStats(statsRes.data.data || {
        total_wards: 0,
        total_beds: 0,
        available_beds: 0,
        occupied_beds: 0,
        active_assignments: 0,
        avg_stay_days: 0
      });
    } catch (error) {
      toast.error('Failed to retrieve ward data');
      console.error('Ward fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWardDetails = async (wardId) => {
    try {
      setLoadingWardDetails(true);
      const res = await api.get(`/wards/${wardId}`);
      setSelectedWard(res.data.data.ward);
      setSelectedWardBeds(res.data.data.beds || []);
    } catch (error) {
      toast.error('Failed to retrieve beds configuration');
      console.error('Ward details fetch error:', error);
    } finally {
      setLoadingWardDetails(false);
    }
  };

  const fetchStaticLists = async () => {
    try {
      const [deptRes, patientRes] = await Promise.all([
        api.get('/doctors/department-heads'),
        api.get('/patients')
      ]);
      setDepartments(deptRes.data.data || []);
      setPatients(patientRes.data.data || []);
    } catch (error) {
      console.error('Static list fetch error:', error);
    }
  };

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!wardForm.wardName || !wardForm.wardType || !wardForm.totalBeds) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        wardName: wardForm.wardName,
        wardType: wardForm.wardType,
        floorNumber: wardForm.floorNumber ? parseInt(wardForm.floorNumber) : null,
        totalBeds: parseInt(wardForm.totalBeds),
        departmentId: wardForm.departmentId ? parseInt(wardForm.departmentId) : null,
        phone: wardForm.phone || null
      };

      await api.post('/wards', payload);
      toast.success('Ward added successfully');
      setShowAddWardModal(false);
      resetWardForm();
      fetchWardsAndStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create ward';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditWard = (ward) => {
    setWardToEdit(ward);
    setEditWardForm({
      wardName: ward.ward_name,
      wardType: ward.ward_type,
      floorNumber: ward.floor_number || '',
      phone: ward.phone || '',
      departmentId: ward.department_id || ''
    });
    setShowEditWardModal(true);
  };

  const handleUpdateWard = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.put(`/wards/${wardToEdit.ward_id}`, editWardForm);
      toast.success('Ward updated successfully');
      setShowEditWardModal(false);
      fetchWardsAndStats();
    } catch (error) {
      toast.error('Failed to update ward');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWard = async (wardId, wardName) => {
    if (window.confirm(`Are you sure you want to delete ${wardName} and ALL of its beds?`)) {
      try {
        await api.delete(`/wards/${wardId}`);
        toast.success('Ward deleted successfully');
        fetchWardsAndStats();
      } catch (error) {
        toast.error('Failed to delete ward');
      }
    }
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    const wardId = bedForm.wardId || selectedWard?.ward_id;
    if (!wardId || !bedForm.bedNumber) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        wardId: parseInt(wardId),
        bedNumber: bedForm.bedNumber,
        bedType: bedForm.bedType,
        floorPosition: bedForm.floorPosition || null
      };

      await api.post('/wards/bed', payload);
      toast.success(`Bed ${bedForm.bedNumber} added successfully`);
      setShowAddBedModal(false);
      resetBedForm();
      fetchWardsAndStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add bed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignBed = async (e) => {
    e.preventDefault();
    if (!targetBed || !assignForm.patientId) {
      toast.error('Please select a patient to assign');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        bedId: targetBed.bed_id,
        patientId: parseInt(assignForm.patientId),
        assignedBy: user?.personId || user?.userId || 1
      };

      await api.post('/wards/assign', payload);
      toast.success(`Patient assigned to Bed ${targetBed.bed_number}`);
      setShowAssignModal(false);
      setAssignForm({ patientId: '' });
      setTargetBed(null);
      fetchWardsAndStats();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to assign patient';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseBed = async (bed) => {
    if (!bed.assignment_id) {
      toast.error('No active assignment found for this bed');
      return;
    }

    if (!window.confirm(`Are you sure you want to discharge patient ${bed.patient_name} and release Bed ${bed.bed_number}?`)) {
      return;
    }

    try {
      await api.post(`/wards/release/${bed.assignment_id}`, { notes: 'Discharged from ward' });
      toast.success(`Bed ${bed.bed_number} released successfully`);
      fetchWardsAndStats();
    } catch (error) {
      toast.error('Failed to release bed');
      console.error(error);
    }
  };

  const resetWardForm = () => {
    setWardForm({
      wardName: '',
      wardType: 'General',
      floorNumber: '',
      totalBeds: '',
      departmentId: '',
      phone: ''
    });
  };

  const resetBedForm = () => {
    setBedForm({
      wardId: '',
      bedNumber: '',
      bedType: 'General',
      floorPosition: ''
    });
  };

  const openAssignModal = (bed) => {
    setTargetBed(bed);
    setShowAssignModal(true);
  };

  const getWardTypeClass = (type) => {
    const classes = {
      'ICU': 'badge-error',
      'Maternity': 'badge-primary',
      'Pediatric': 'badge-success',
      'General': 'badge-secondary',
      'Surgical': 'badge-warning'
    };
    return classes[type] || 'badge-muted';
  };

  const getBedStatusBadge = (status) => {
    const badges = {
      'Available': 'badge-success',
      'Occupied': 'badge-error',
      'Cleaning': 'badge-warning',
      'Maintenance': 'badge-muted'
    };
    return badges[status] || 'badge-muted';
  };

  return (
    <div className="page-container">
      <Sidebar />

      <main className="main-content">
        {!selectedWard ? (
          <>
            <header className="page-header">
              <div>
                <h1 className="page-title">Wards & Occupancy</h1>
                <p className="page-subtitle">Oversee ward configurations, live bed vacancy dashboards, and admissions</p>
              </div>
              <div className="header-actions">
                {isAdmin && (
                  <button className="btn btn-primary" onClick={() => setShowAddWardModal(true)}>
                    <Plus size={20} />
                    Add New Ward
                  </button>
                )}
              </div>
            </header>

            {/* Stats Dashboard */}
            <section className="stats-grid">
              <div className="stat-card glass-card">
                <div className="stat-icon stat-icon-teal">
                  <Layers size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_wards || 0}</div>
                  <div className="stat-label">Total Wards</div>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon stat-icon-blue">
                  <Bed size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.total_beds || 0}</div>
                  <div className="stat-label">Total Beds Configured</div>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon stat-icon-green">
                  <CheckCircle size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-value text-success">{stats.available_beds || 0}</div>
                  <div className="stat-label">Available Beds</div>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon stat-icon-orange">
                  <Users size={28} />
                </div>
                <div className="stat-content">
                  <div className="stat-value text-error">
                    {stats.occupied_beds || 0}
                  </div>
                  <div className="stat-label">Occupied Beds</div>
                </div>
              </div>
            </section>

            {/* Filters Bar */}
            <div className="filter-bar-card glass-card mb-lg">
              <div className="filter-pill-selector">
                <button
                  className={`filter-tab-pill ${selectedWardType === '' ? 'active' : ''}`}
                  onClick={() => setSelectedWardType('')}
                >
                  All Types
                </button>
                <button
                  className={`filter-tab-pill ${selectedWardType === 'General' ? 'active' : ''}`}
                  onClick={() => setSelectedWardType('General')}
                >
                  General
                </button>
                <button
                  className={`filter-tab-pill ${selectedWardType === 'ICU' ? 'active' : ''}`}
                  onClick={() => setSelectedWardType('ICU')}
                >
                  ICU
                </button>
                <button
                  className={`filter-tab-pill ${selectedWardType === 'Maternity' ? 'active' : ''}`}
                  onClick={() => setSelectedWardType('Maternity')}
                >
                  Maternity
                </button>
                <button
                  className={`filter-tab-pill ${selectedWardType === 'Pediatric' ? 'active' : ''}`}
                  onClick={() => setSelectedWardType('Pediatric')}
                >
                  Pediatric
                </button>
              </div>

              <div className="search-input-wrapper flex-grow-1">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search ward by name or clinical department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            {/* Wards Layout Grid */}
            {loading ? (
              <div className="loading-state glass-card">
                <div className="spinner"></div>
                <p>Retrieving ward registries...</p>
              </div>
            ) : wards.length === 0 ? (
              <div className="empty-state glass-card">
                <AlertCircle size={48} className="text-warning mb-md" />
                <h3>No Wards Configured</h3>
                <p>Try refining your search terms or create a new ward if you are an Administrator.</p>
              </div>
            ) : (
              <div className="wards-grid">
                {wards.map((ward) => {
                  const occupied = ward.occupied_beds || 0;
                  const total = ward.total_beds || 0;
                  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
                  const available = ward.available_beds || 0;

                  return (
                    <div key={ward.ward_id} className="ward-card glass-card">
                      <div className="ward-card-header">
                        <div>
                          <h3 className="ward-name">{ward.ward_name}</h3>
                          <span className={`badge ${getWardTypeClass(ward.ward_type)}`}>
                            {ward.ward_type}
                          </span>
                        </div>
                        <div className="ward-occupancy-badge">
                          <span className="occupancy-pct">{occupancyRate}%</span>
                          <span className="occupancy-lbl">Occupied</span>
                        </div>
                      </div>

                      <div className="ward-card-body">
                        {/* Occupancy Progress Bar */}
                        <div className="progress-container mb-md">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${occupancyRate}%`,
                              background: occupancyRate > 85 ? 'var(--gradient-error)' : 'var(--gradient-primary)'
                            }}
                          ></div>
                        </div>

                        <div className="ward-info-rows">
                          <div className="info-row">
                            <Briefcase size={16} className="text-muted" />
                            <div>
                              <span className="info-lbl">Clinical Department</span>
                              <span className="info-val">{ward.department_name || 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="info-row">
                            <Compass size={16} className="text-muted" />
                            <div>
                              <span className="info-lbl">Hospital Location</span>
                              <span className="info-val">Floor {ward.floor_number || 1}</span>
                            </div>
                          </div>
                          {ward.phone && (
                            <div className="info-row">
                              <Phone size={16} className="text-muted" />
                              <div>
                                <span className="info-lbl">Extension Phone</span>
                                <span className="info-val">{ward.phone}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ward-card-footer">
                        <div className="beds-counter-summary">
                          <span className="beds-count-val">{available} Available</span>
                          <span className="beds-count-total">/ {total} Total Beds</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {(isAdmin) && (
                            <>
                              <button className="btn-icon" onClick={() => handleEditWard(ward)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <Edit size={16} />
                              </button>
                              <button className="btn-icon" onClick={() => handleDeleteWard(ward.ward_id, ward.ward_name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => fetchWardDetails(ward.ward_id)}
                          >
                            Manage Beds
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Detailed Ward Grid View */
          <>
            <header className="page-header">
              <div className="header-back-wrapper">
                <button className="btn-back mr-md" onClick={() => setSelectedWard(null)}>
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="page-title">{selectedWard.ward_name} Beds Config</h1>
                  <p className="page-subtitle">
                    Floor {selectedWard.floor_number || 1} • {selectedWard.ward_type} Ward • Department: {selectedWard.department_name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="header-actions">
                {(isAdmin || isReceptionist) && (
                  <button className="btn btn-secondary mr-sm" onClick={() => setShowAddBedModal(true)}>
                    <Plus size={18} />
                    Add Bed to Ward
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setSelectedWard(null)}>
                  Back to Wards
                </button>
              </div>
            </header>

            {loadingWardDetails ? (
              <div className="loading-state glass-card">
                <div className="spinner"></div>
                <p>Loading beds map...</p>
              </div>
            ) : selectedWardBeds.length === 0 ? (
              <div className="empty-state glass-card">
                <Bed size={48} className="text-muted mb-md" />
                <h3>No Beds Registered</h3>
                <p>This ward currently has no beds set up. Click "Add Bed to Ward" above to get started.</p>
              </div>
            ) : (
              <div className="beds-workspace">
                <h2 className="workspace-subheading mb-lg">Ward Layout Map</h2>
                <div className="beds-grid">
                  {selectedWardBeds.map((bed) => {
                    const isOccupied = bed.status === 'Occupied';
                    return (
                      <div key={bed.bed_id} className={`bed-card glass-card ${isOccupied ? 'occupied' : 'available'}`}>
                        <div className="bed-card-header">
                          <div className="bed-icon-badge">
                            <Bed size={22} className={isOccupied ? 'text-error' : 'text-success'} />
                            <span className="bed-number">{bed.bed_number}</span>
                          </div>
                          <span className={`badge ${getBedStatusBadge(bed.status)}`}>
                            {bed.status}
                          </span>
                        </div>

                        <div className="bed-card-body">
                          <div className="bed-spec-info mb-md">
                            <span className="bed-type">{bed.bed_type} Bed</span>
                            {bed.floor_position && (
                              <span className="bed-position text-muted">Pos: {bed.floor_position}</span>
                            )}
                          </div>

                          {isOccupied ? (
                            <div className="bed-patient-assignment">
                              <span className="assignment-lbl">Admitted Patient</span>
                              <span className="patient-name">{bed.patient_name}</span>
                              <span className="patient-code">{bed.patient_code}</span>
                            </div>
                          ) : (
                            <div className="bed-empty-placeholder">
                              <span className="assignment-lbl">Assignment</span>
                              <span className="text-success font-weight-600">Bed Vacant</span>
                            </div>
                          )}
                        </div>

                        <div className="bed-card-footer">
                          {isOccupied ? (
                            <button
                              className="btn btn-danger btn-block btn-sm"
                              onClick={() => handleReleaseBed(bed)}
                              disabled={!isStaff}
                            >
                              Release / Discharge
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-block btn-sm"
                              onClick={() => openAssignModal(bed)}
                              disabled={!isStaff}
                            >
                              Assign Patient
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Edit Ward Modal */}
      {showEditWardModal && wardToEdit && (
        <div className="modal-overlay" onClick={() => setShowEditWardModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Ward Config</h2>
              <button className="btn-close" onClick={() => setShowEditWardModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateWard} className="modal-form">
              <div className="form-group">
                <label className="form-label">Ward Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editWardForm.wardName}
                  onChange={(e) => setEditWardForm({...editWardForm, wardName: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ward Type *</label>
                  <select
                    className="form-select"
                    value={editWardForm.wardType}
                    onChange={(e) => setEditWardForm({...editWardForm, wardType: e.target.value})}
                    required
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Isolation">Isolation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Floor Number</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editWardForm.floorNumber}
                    onChange={(e) => setEditWardForm({...editWardForm, floorNumber: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Extension</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editWardForm.phone}
                    onChange={(e) => setEditWardForm({...editWardForm, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Department</label>
                  <select
                    className="form-select"
                    value={editWardForm.departmentId}
                    onChange={(e) => setEditWardForm({...editWardForm, departmentId: e.target.value})}
                  >
                    <option value="">-- No Department --</option>
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditWardModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {showAddWardModal && (
        <div className="modal-overlay" onClick={() => setShowAddWardModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Ward</h2>
              <button className="btn-close" onClick={() => setShowAddWardModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddWard} className="modal-form">
              <div className="form-group">
                <label className="form-label">Ward Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ICU Wing A"
                  value={wardForm.wardName}
                  onChange={(e) => setWardForm({ ...wardForm, wardName: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ward Type *</label>
                  <select
                    className="form-select"
                    value={wardForm.wardType}
                    onChange={(e) => setWardForm({ ...wardForm, wardType: e.target.value })}
                    required
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Surgical">Surgical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Beds *</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    placeholder="e.g. 10"
                    value={wardForm.totalBeds}
                    onChange={(e) => setWardForm({ ...wardForm, totalBeds: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Floor Number</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 2"
                    value={wardForm.floorNumber}
                    onChange={(e) => setWardForm({ ...wardForm, floorNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Select Department</label>
                  <select
                    className="form-select"
                    value={wardForm.departmentId}
                    onChange={(e) => setWardForm({ ...wardForm, departmentId: e.target.value })}
                  >
                    <option value="">-- Choose Dept --</option>
                    {departments.map(d => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Extension Phone</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ext 2401"
                  value={wardForm.phone}
                  onChange={(e) => setWardForm({ ...wardForm, phone: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddWardModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {showAddBedModal && (
        <div className="modal-overlay" onClick={() => setShowAddBedModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Bed</h2>
              <button className="btn-close" onClick={() => setShowAddBedModal(false)}>×</button>
            </div>

            <form onSubmit={handleAddBed} className="modal-form">
              <div className="form-group">
                <label className="form-label">Bed Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bed-101"
                  value={bedForm.bedNumber}
                  onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Bed Type *</label>
                  <select
                    className="form-select"
                    value={bedForm.bedType}
                    onChange={(e) => setBedForm({ ...bedForm, bedType: e.target.value })}
                    required
                  >
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Private">Private</option>
                    <option value="Semi-Private">Semi-Private</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Floor Position</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Window side, Row A"
                    value={bedForm.floorPosition}
                    onChange={(e) => setBedForm({ ...bedForm, floorPosition: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddBedModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Patient Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Patient to Bed {targetBed?.bed_number}</h2>
              <button className="btn-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>

            <form onSubmit={handleAssignBed} className="modal-form">
              <div className="form-group">
                <label className="form-label">Select Admitting Patient *</label>
                <select
                  className="form-select"
                  value={assignForm.patientId}
                  onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.first_name} {p.last_name} ({p.patient_code})
                    </option>
                  ))}
                </select>
                <span className="input-helper-text">
                  Only patient profiles registered in the system are admitting list valid.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAssignModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
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

        .header-back-wrapper {
          display: flex;
          align-items: center;
        }

        .btn-back {
          background: rgba(0, 151, 167, 0.08);
          border: none;
          color: var(--primary-teal);
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .btn-back:hover {
          background: var(--primary-teal);
          color: white;
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

        .wards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
        }

        .ward-card {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          min-height: 280px;
          transition: all var(--transition-normal);
        }

        .ward-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(31, 38, 135, 0.15);
        }

        .ward-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
        }

        .ward-name {
          font-size: 1.2rem;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .ward-occupancy-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .occupancy-pct {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--primary-teal);
        }

        .occupancy-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .progress-container {
          background: rgba(0, 0, 0, 0.05);
          height: 6px;
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.6s ease-in-out;
        }

        .ward-info-rows {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .info-lbl {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .info-val {
          display: block;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .ward-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(0, 0, 0, 0.04);
        }

        .beds-counter-summary {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .beds-count-val {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--primary-teal);
        }

        .beds-count-total {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Beds Layout Grid details */
        .workspace-subheading {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .beds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: var(--spacing-lg);
        }

        .bed-card {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          min-height: 200px;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .bed-card:hover {
          transform: translateY(-2px);
        }

        .bed-card.occupied {
          border-left: 4px solid var(--error);
        }

        .bed-card.available {
          border-left: 4px solid var(--success);
          border-style: dashed;
        }

        .bed-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .bed-icon-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .bed-number {
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .bed-spec-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          padding-bottom: 4px;
        }

        .bed-type {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .bed-patient-assignment {
          display: flex;
          flex-direction: column;
          background: rgba(244, 67, 54, 0.05);
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
        }

        .assignment-lbl {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .patient-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .patient-code {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: monospace;
          margin-top: 1px;
        }

        .bed-empty-placeholder {
          display: flex;
          flex-direction: column;
          padding: var(--spacing-sm);
        }

        .bed-card-footer {
          margin-top: auto;
          padding-top: var(--spacing-md);
        }

        .btn-block {
          width: 100%;
        }

        .font-weight-600 {
          font-weight: 600;
        }

        .mr-md {
          margin-right: var(--spacing-md);
        }

        .mr-sm {
          margin-right: var(--spacing-sm);
        }

        .mb-0 {
          margin-bottom: 0 !important;
        }

        /* Modal Overlays */
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
          max-width: 550px;
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

        .input-helper-text {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 4px;
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

export default Wards;
