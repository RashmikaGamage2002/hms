import { useNavigate } from 'react-router-dom';
import doctorImg from '../welcome_doctor.png';
import { Shield, Clock, Heart, Award, CheckCircle } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      {/* Sleek Glassmorphic Navbar */}
      <header className="welcome-nav glass-card">
        <div className="nav-logo">
          <div className="nav-logo-icon">
            <Heart size={20} />
          </div>
          <span>MedicPro</span>
        </div>
        <div className="nav-actions">
          <button className="nav-btn about-btn" onClick={() => navigate('/about')}>
            About Us
          </button>
          <button className="nav-btn login-btn" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="welcome-hero">
        <div className="hero-content">
          <span className="hero-badge">Welcome to MedicPro</span>
          <h1 className="hero-title">
            The Best Medical Center & Treatment for You
          </h1>
          <p className="hero-subtitle">
            We understand that acute pain and injuries can arise unexpectedly. Our team is fully prepared to offer fast, compassionate, and highly efficient medical care whenever you need it most.
          </p>

          {/* Stats Row */}
          <div className="hero-stats">
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Emergency Care</p>
            </div>
            <div className="stat-item">
              <h3>80+</h3>
              <p>Specialists</p>
            </div>
            <div className="stat-item">
              <h3>100k+</h3>
              <p>Patients Served</p>
            </div>
          </div>
        </div>

        <div className="hero-image-wrapper">
          <div className="image-backdrop"></div>
          <img src={doctorImg} alt="Professional Doctor" className="hero-image" />
        </div>
      </section>

      {/* Feature Cards Grid (Strictly no buttons inside, purely informative and gorgeous) */}
      <section className="welcome-features">
        <div className="feature-card glass-card">
          <div className="feature-icon icon-cyan">
            <Shield size={24} />
          </div>
          <div className="feature-info">
            <h3>Connected & Professional Care</h3>
            <p>Direct integration with certified medical professionals offering secure, reliable, and accessible consultations.</p>
          </div>
        </div>

        <div className="feature-card glass-card highlighted">
          <div className="feature-icon icon-white">
            <Award size={24} />
          </div>
          <div className="feature-info">
            <h3>Expert Physicians</h3>
            <p>Our specialists hold world-class clinical degrees and undergo ongoing training to provide industry-leading patient services.</p>
          </div>
        </div>

        <div className="feature-card glass-card">
          <div className="feature-icon icon-blue">
            <Clock size={24} />
          </div>
          <div className="feature-info">
            <h3>State-of-the-Art Facilities</h3>
            <p>Equipped with advanced diagnostic machines, specialized laboratory wards, and fully digital pharmacy inventories.</p>
          </div>
        </div>
      </section>

      {/* Brands Footer */}
      <footer className="welcome-footer">
        <div className="brand-logos">
          <span>MediaFire</span>
          <span>ACDoctor</span>
          <span>Dr.WEB®</span>
          <span>NVIDIA</span>
        </div>
      </footer>

      <style jsx>{`
        .welcome-container {
          min-height: 100vh;
          background: #eef5f6;
          background-image:
            radial-gradient(circle at 10% 20%, rgba(0, 151, 167, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(21, 101, 192, 0.12) 0%, transparent 40%);
          display: flex;
          flex-direction: column;
          padding: 2rem 4rem;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* Nav styles */
        .welcome-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-radius: var(--radius-xl);
          margin-bottom: 3rem;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 10px 30px rgba(0, 151, 167, 0.05);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--primary-teal);
        }

        .nav-logo-icon {
          width: 32px;
          height: 32px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .nav-actions {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-btn {
          padding: 0.6rem 1.8rem;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .about-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
        }

        .about-btn:hover {
          color: var(--primary-teal);
        }

        .login-btn {
          background: var(--gradient-primary);
          border: none;
          color: white;
          box-shadow: 0 4px 15px rgba(0, 151, 167, 0.2);
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 151, 167, 0.3);
        }

        /* Hero styles */
        .welcome-hero {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4rem;
          align-items: center;
          margin-bottom: 4rem;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-badge {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          width: fit-content;
          font-weight: 600;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .hero-title {
          font-size: 3.2rem;
          line-height: 1.2;
          font-weight: 800;
          color: #0b222c;
          background: linear-gradient(135deg, #0b222c 0%, #0097A7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: #556b73;
          line-height: 1.7;
        }

        .hero-stats {
          display: flex;
          gap: 3rem;
          margin-top: 2rem;
          background: rgba(255, 255, 255, 0.5);
          padding: 1.5rem 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(5px);
          width: fit-content;
        }

        .stat-item h3 {
          font-size: 1.8rem;
          color: var(--primary-teal);
          font-weight: 800;
          margin-bottom: 0.25rem;
        }

        .stat-item p {
          font-size: 0.85rem;
          color: #6a828c;
          font-weight: 500;
        }

        /* Image styling */
        .hero-image-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .image-backdrop {
          position: absolute;
          width: 90%;
          height: 90%;
          background: var(--gradient-primary);
          border-radius: 40px;
          transform: rotate(3deg);
          z-index: 1;
          opacity: 0.95;
          box-shadow: 0 20px 40px rgba(0, 151, 167, 0.2);
        }

        .hero-image {
          position: relative;
          width: 86%;
          height: auto;
          object-fit: cover;
          border-radius: 36px;
          z-index: 2;
          border: 4px solid white;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          transition: transform 0.3s ease;
        }

        .hero-image:hover {
          transform: scale(1.02);
        }

        /* Feature grid */
        .welcome-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .feature-card {
          display: flex;
          gap: 1.5rem;
          padding: 2rem;
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.7);
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0, 151, 167, 0.08);
          border-color: rgba(0, 151, 167, 0.2);
        }

        .feature-card.highlighted {
          background: var(--gradient-primary);
          color: white;
          border: none;
          box-shadow: 0 15px 35px rgba(0, 151, 167, 0.15);
        }

        .feature-card.highlighted .feature-info h3 {
          color: white;
        }

        .feature-card.highlighted .feature-info p {
          color: rgba(255, 255, 255, 0.9);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-cyan {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
        }

        .icon-blue {
          background: rgba(21, 101, 192, 0.1);
          color: var(--primary-blue);
        }

        .icon-white {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .feature-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feature-info h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0b222c;
        }

        .feature-info p {
          font-size: 0.9rem;
          color: #556b73;
          line-height: 1.6;
        }

        /* Footer brands */
        .welcome-footer {
          margin-top: auto;
          border-top: 1px solid rgba(0, 151, 167, 0.1);
          padding-top: 2rem;
        }

        .brand-logos {
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
          opacity: 0.6;
        }

        .brand-logos span {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #6a828c;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .welcome-container {
            padding: 2rem;
          }

          .welcome-hero {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }

          .hero-badge {
            margin: 0 auto;
          }

          .hero-stats {
            margin: 2rem auto 0;
          }

          .welcome-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
