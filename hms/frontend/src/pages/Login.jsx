import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(formData.username, formData.password);

      // Redirect to the system dashboard
      navigate('/dashboard');
    } catch (error) {
      // Error handled in auth context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      {/* Back button to welcome page */}
      <Link to="/" className="back-button">
        <ArrowLeft size={18} />
        <span>Back to Home Page</span>
      </Link>

      {/* Background decoration */}
      <div className="login-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-wrapper">
        <div className="login-card glass-card">
          {/* Logo Section */}
          <div className="login-logo">
            <div className="logo-icon">
              <Activity size={48} />
            </div>
            <h1>MedicPro</h1>
            <p>Hospital Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue to your dashboard</p>

            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="form-input"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input type="checkbox" name="remember" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-lg login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="demo-credentials">
            <p className="demo-title">Demo Credentials:</p>
            <div className="demo-list">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Doctor:</strong> doctor / doctor123</div>
              <div><strong>Pharmacist:</strong> pharmacist / pharmacist123</div>
              <div><strong>Receptionist:</strong> receptionist / receptionist123</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .back-button {
          position: absolute;
          top: var(--spacing-lg);
          left: var(--spacing-lg);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          background: var(--glass-bg);
          backdrop-filter: var(--glass-backdrop);
          -webkit-backdrop-filter: var(--glass-backdrop);
          border: 1px solid var(--glass-border);
          box-shadow: var(--glass-shadow);
          z-index: 10;
          transition: all var(--transition-normal);
        }

        .back-button:hover {
          color: var(--primary-teal);
          transform: translateX(-4px);
          box-shadow: 0 4px 15px rgba(0, 151, 167, 0.15);
          border-color: rgba(0, 151, 167, 0.3);
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          position: relative;
          overflow: hidden;
        }

        .login-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .circle {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-teal), var(--primary-blue));
          opacity: 0.1;
          animation: float 20s infinite ease-in-out;
        }

        .circle-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          left: -100px;
        }

        .circle-2 {
          width: 300px;
          height: 300px;
          bottom: -50px;
          right: -50px;
          animation-delay: -5s;
        }

        .circle-3 {
          width: 200px;
          height: 200px;
          top: 50%;
          right: 10%;
          animation-delay: -10s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .login-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 450px;
        }

        .login-card {
          padding: var(--spacing-xxl);
        }

        .login-logo {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }

        .logo-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: var(--gradient-primary);
          border-radius: var(--radius-xl);
          color: white;
          margin-bottom: var(--spacing-md);
        }

        .login-logo h1 {
          font-size: 2rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-xs);
        }

        .login-logo p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .login-form h2 {
          font-size: 1.5rem;
          margin-bottom: var(--spacing-xs);
          color: var(--text-primary);
        }

        .login-subtitle {
          color: var(--text-secondary);
          margin-bottom: var(--spacing-xl);
        }

        .input-wrapper {
          position: relative;
        }

        .password-input input {
          padding-right: 50px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: var(--spacing-sm);
        }

        .password-toggle:hover {
          color: var(--primary-teal);
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          font-size: 0.9rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          cursor: pointer;
        }

        .forgot-link {
          color: var(--primary-teal);
          text-decoration: none;
          font-weight: 500;
        }

        .forgot-link:hover {
          text-decoration: underline;
        }

        .login-btn {
          width: 100%;
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: 1rem;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .demo-credentials {
          margin-top: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: rgba(0, 151, 167, 0.05);
          border-radius: var(--radius-md);
          border: 1px solid rgba(0, 151, 167, 0.1);
        }

        .demo-title {
          font-weight: 600;
          color: var(--primary-teal);
          margin-bottom: var(--spacing-sm);
          font-size: 0.9rem;
        }

        .demo-list {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .demo-list div {
          padding: var(--spacing-xs) 0;
        }
      `}</style>
    </div>
  );
};

export default Login;
