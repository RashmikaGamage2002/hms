import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Pill,
  Calendar,
  FileText,
  Bed,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const getMenuItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Doctor', 'Pharmacist', 'Receptionist'] }
    ];

    const roleSpecificItems = {
      Admin: [
        { path: '/patients', icon: Users, label: 'Patients' },
        { path: '/doctors', icon: Stethoscope, label: 'Doctors' },
        { path: '/pharmacy', icon: Pill, label: 'Pharmacy' },
        { path: '/appointments', icon: Calendar, label: 'Appointments' },
        { path: '/wards', icon: Bed, label: 'Wards' },
        { path: '/billing', icon: FileText, label: 'Billing' },
        { path: '/reports', icon: FileText, label: 'Reports' }
      ],
      Doctor: [
        { path: '/patients', icon: Users, label: 'Patients' },
        { path: '/appointments', icon: Calendar, label: 'Appointments' },
        { path: '/my-schedule', icon: Calendar, label: 'My Schedule' }
      ],
      Pharmacist: [
        { path: '/pharmacy', icon: Pill, label: 'Pharmacy' },
        { path: '/inventory', icon: Pill, label: 'Inventory' }
      ],
      Receptionist: [
        { path: '/patients', icon: Users, label: 'Patients' },
        { path: '/appointments', icon: Calendar, label: 'Appointments' },
        { path: '/wards', icon: Bed, label: 'Wards' },
        { path: '/billing', icon: FileText, label: 'Billing' }
      ]
    };

    const userRole = user?.role;
    const specificItems = roleSpecificItems[userRole] || [];

    return [...commonItems, ...specificItems].filter(item =>
      !item.roles || item.roles.includes(userRole)
    );
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-small">
            <LayoutDashboard size={24} />
          </div>
          <span>MedicPro</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <li key={item.path} className="sidebar-nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user?.role !== 'Doctor' && (
            <div className="user-info">
              <div className="user-avatar">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          )}

          <button className="sidebar-nav-link logout-link" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <style jsx>{`
        .mobile-menu-btn {
          display: none;
          position: fixed;
          top: var(--spacing-md);
          left: var(--spacing-md);
          z-index: 101;
          background: var(--gradient-primary);
          border: none;
          color: white;
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          background: rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }

        .logout-link {
          color: #111111;
          background: #ffffff;
          cursor: pointer;
          width: 100%;
          text-align: left;
          border-radius: var(--radius-md);
          margin-top: var(--spacing-sm);
          border: 1.5px solid rgba(0,0,0,0.08);
        }

        .logout-link:hover {
          background: #f1f1f1;
          color: #cc0000;
          border-color: rgba(204,0,0,0.2);
        }

        .logo-icon-small {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: flex;
          }

          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
