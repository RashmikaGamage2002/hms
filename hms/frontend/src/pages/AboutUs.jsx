import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Stethoscope, Heart, Award, ShieldAlert, Sparkles, Building, PhoneCall, Mail, MapPin } from 'lucide-react';

const AboutUs = () => {
  const navigate = useNavigate();

  // Active department heads from our database query
  const deptHeads = [
    { name: 'Dr. John Smith', role: 'Head of Cardiology & Dean of Clinical Affairs', spec: 'Cardiology', exp: '15 Years Experience' },
    { name: 'Dr. Sarah Johnson', role: 'Head of Neurology', spec: 'Neurology', exp: '12 Years Experience' },
    { name: 'Dr. Michael Perera', role: 'Head of Pediatrics', spec: 'Pediatrics', exp: '10 Years Experience' },
    { name: 'Dr. David Silva', role: 'Head of Emergency Medicine', spec: 'Emergency Medicine', exp: '8 Years Experience' },
    { name: 'Dr. Emily Fernando', role: 'Senior Consultant & Clinical Supervisor', spec: 'General Medicine', exp: '18 Years Experience' }
  ];

  // Facilities
  const facilities = [
    { name: 'Emergency Care Unit', desc: 'Fully equipped 24/7 trauma ward handling critical and acute emergencies with high-priority dispatch.' },
    { name: 'Advanced Radiology & Imaging', desc: 'Equipped with MRI, high-speed CT scans, digital X-rays, and real-time diagnostic reports.' },
    { name: 'Intensive Care Unit (ICU)', desc: 'Advanced monitoring beds, automated oxygen ventilators, and around-the-clock intensive nursing.' },
    { name: 'Digital Pharmacy & Dispensing', desc: 'Highly organized inventory tracking using FEFO (First Expiry First Out) to ensure zero expired drugs.' },
    { name: 'Modern Wards & Beds', desc: 'Spacious, high-comfort inpatient wards categorized by floor, fully integrated with call buzzers.' },
    { name: 'Automated Billing & Finance', desc: 'Instant itemized invoicing, secure transaction processing, and tax/discount calculations.' }
  ];

  return (
    <div className="about-container">
      {/* Navbar with back navigation */}
      <header className="about-nav glass-card">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        <span className="about-nav-title">MedicPro</span>
      </header>

      {/* Dean's Welcome Banner */}
      <section className="deans-message-section glass-card">
        <div className="deans-profile">
          <div className="deans-avatar">JS</div>
          <div className="deans-meta">
            <h3>Dr. John Smith, MD</h3>
            <span>Dean of Clinical Affairs & Head of Cardiology</span>
            <p>Fellowship in Interventional Cardiology (Johns Hopkins)</p>
          </div>
        </div>
        <div className="message-content">
          <h2 className="section-title">
            <Sparkles size={22} className="inline-icon" /> Dean's Welcoming Message
          </h2>
          <p>
            "Welcome to MedicPro. As the Dean, I am proud to lead an exceptional community of physicians, staff, and researchers dedicated to delivering clinical excellence. At our core, we combine advanced digital health technology, high-precision operations, and empathetic patient care to redefine hospital management. Our mission is to make healthcare seamless, reliable, and accessible for everyone."
          </p>
        </div>
      </section>

      {/* Main Details Grid */}
      <main className="about-main-grid">
        {/* Left Side: Hospital Details */}
        <div className="details-left">
          <section className="about-section glass-card">
            <h2 className="section-title">
              <Building size={20} className="inline-icon" /> About Our Hospital
            </h2>
            <p className="main-desc">
              MedicPro is a multi-specialty clinical institution recognized for premium healthcare delivery and research. With a fully integrated database and operational tracking, we maintain optimal occupancy, secure drug inventory control, and precision-driven appointment schedules to serve our community at a professional administrative level.
            </p>
            
            <div className="core-values">
              <div className="value-item">
                <Heart className="value-icon" size={20} />
                <div>
                  <h4>Patient Centeredness</h4>
                  <p>Every clinical and operational protocol is engineered with patient comfort and recovery as the highest priority.</p>
                </div>
              </div>
              <div className="value-item">
                <Award className="value-icon" size={20} />
                <div>
                  <h4>Quality & Safety</h4>
                  <p>Adhering strictly to international WHO standards, ensuring sterile environments and mistake-free drug administrations.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Facilities list */}
          <section className="about-section glass-card">
            <h2 className="section-title">
              <Stethoscope size={20} className="inline-icon" /> Our State-of-the-Art Facilities
            </h2>
            <div className="facilities-grid">
              {facilities.map((fac, idx) => (
                <div key={idx} className="facility-item">
                  <h4>{fac.name}</h4>
                  <p>{fac.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Department Heads & Contacts */}
        <div className="details-right">
          <section className="about-section glass-card">
            <h2 className="section-title">
              <Award size={20} className="inline-icon" /> Department Heads
            </h2>
            <div className="heads-list">
              {deptHeads.map((head, idx) => (
                <div key={idx} className="head-item">
                  <div className="head-info">
                    <h4>{head.name}</h4>
                    <span className="head-role">{head.role}</span>
                    <p className="head-spec">Specialization: <strong>{head.spec}</strong></p>
                  </div>
                  <span className="head-exp badge badge-primary">{head.exp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Hospital Contact Details */}
          <section className="about-section glass-card contact-section">
            <h2 className="section-title">Contact & Location</h2>
            <div className="contact-details">
              <div className="contact-item">
                <MapPin size={18} />
                <span>MedicPro Central Complex, Park Road, Colombo 05, Sri Lanka</span>
              </div>
              <div className="contact-item">
                <PhoneCall size={18} />
                <span>+94 11 234 5678 / +94 11 234 5679</span>
              </div>
              <div className="contact-item">
                <Mail size={18} />
                <span>clinical.services@medicpro.org</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .about-container {
          min-height: 100vh;
          background: #eef5f6;
          background-image:
            radial-gradient(circle at 15% 15%, rgba(0, 151, 167, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(21, 101, 192, 0.1) 0%, transparent 45%);
          padding: 2rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .about-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: var(--primary-teal);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .back-btn:hover {
          transform: translateX(-4px);
        }

        .about-nav-title {
          font-weight: 700;
          font-size: 1.2rem;
          color: var(--text-secondary);
        }

        /* Dean message banner */
        .deans-message-section {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 3rem;
          padding: 2.5rem;
          align-items: center;
          background: var(--gradient-primary);
          color: white;
          border: none;
          box-shadow: 0 12px 40px rgba(0, 151, 167, 0.15);
        }

        .deans-profile {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          padding-right: 2rem;
        }

        .deans-avatar {
          width: 70px;
          height: 70px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .deans-meta h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .deans-meta span {
          font-size: 0.9rem;
          font-weight: 500;
          opacity: 0.9;
          display: block;
        }

        .deans-meta p {
          font-size: 0.8rem;
          opacity: 0.8;
          margin-top: 0.25rem;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-content p {
          font-size: 1.05rem;
          line-height: 1.7;
          font-style: italic;
          opacity: 0.95;
        }

        /* Main Details Grid */
        .about-main-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 2rem;
        }

        .details-left, .details-right {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .about-section {
          padding: 2.5rem;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0b222c;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 2px solid rgba(0, 151, 167, 0.1);
          padding-bottom: 0.75rem;
        }

        .inline-icon {
          color: var(--primary-teal);
        }

        .main-desc {
          font-size: 1.05rem;
          color: #4a5d66;
          line-height: 1.7;
          margin-bottom: 2rem;
        }

        .core-values {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .value-item {
          display: flex;
          gap: 1.25rem;
        }

        .value-icon {
          background: rgba(0, 151, 167, 0.1);
          color: var(--primary-teal);
          padding: 0.5rem;
          border-radius: var(--radius-md);
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .value-item h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0b222c;
          margin-bottom: 0.25rem;
        }

        .value-item p {
          font-size: 0.9rem;
          color: #556b73;
          line-height: 1.5;
        }

        /* Facilities grid */
        .facilities-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .facility-item {
          background: rgba(255, 255, 255, 0.5);
          padding: 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .facility-item h4 {
          color: var(--primary-teal);
          font-weight: 700;
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .facility-item p {
          font-size: 0.85rem;
          color: #556b73;
          line-height: 1.5;
        }

        /* Department Heads list */
        .heads-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .head-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.5);
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .head-item:hover {
          transform: translateY(-2px);
          border-color: rgba(0, 151, 167, 0.2);
        }

        .head-info h4 {
          font-size: 1.05rem;
          color: #0b222c;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .head-role {
          font-size: 0.85rem;
          color: var(--primary-blue);
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
        }

        .head-spec {
          font-size: 0.85rem;
          color: #556b73;
        }

        .head-exp {
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Contact Section */
        .contact-section {
          background: #0b222c !important;
          color: white;
          border: none !important;
        }

        .contact-section .section-title {
          color: white;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .contact-details {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.85);
        }

        .contact-item svg {
          color: var(--primary-teal);
          flex-shrink: 0;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .about-container {
            padding: 2rem;
          }

          .deans-message-section {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .deans-profile {
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 1.5rem;
          }

          .about-main-grid {
            grid-template-columns: 1fr;
          }

          .facilities-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutUs;
