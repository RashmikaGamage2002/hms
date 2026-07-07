# Hospital Management System (HMS)

A comprehensive Hospital Management System built with MySQL, Express.js, and React featuring a modern glassmorphism UI design.

## Features

### Core Modules

1. **Authentication & RBAC**
   - Role-based access control (Admin, Doctor, Pharmacist, Receptionist)
   - JWT-based authentication
   - Secure password hashing with bcrypt

2. **Patient & Ward Management**
   - Patient registration with medical history
   - Ward and bed assignment
   - Bed availability tracking via triggers

3. **Pharmacy & Inventory**
   - Medicine management with categories
   - Low stock alerts (threshold-based)
   - Expiry tracking
   - Auto-deduction via Database Triggers

4. **Doctor & Appointment System**
   - Schedule management
   - Status tracking (Pending/Confirmed/Cancelled)
   - Department head hierarchy

5. **Billing & Reports**
   - Invoice generation via Stored Procedures
   - Revenue trends using Window Functions
   - Inventory status reports
   - Patient load analytics

## Technical Highlights

### Database Design
- **10 Strong Entities**: Person, Department, Staff, Patient, Ward, Bed, Medicine, etc.
- **4 Weak Entities**: MedicalRecord, Prescription, Dispensing, BedAssignment
- **5 Superclass/Subclass Relationships**: Person→Staff→(Doctor, Pharmacist, Receptionist, Admin)
- **14 Relationships**: Including 5 identifying relationships for weak entities

### Advanced SQL Features
- **CTEs** (Common Table Expressions) for hierarchical reporting
- **Window Functions** for revenue analytics and rankings
- **Stored Procedures** for complex business logic
- **Triggers** for automatic inventory management
- **Cursors** for batch processing
- **Functions**: `calculate_patient_age`, `calculate_stay_duration`, `get_medicine_stock`, `is_low_stock`

### Constraints Applied
- `PRIMARY KEY` on all entity tables
- `FOREIGN KEY` with `ON DELETE CASCADE` for referential integrity
- `UNIQUE` constraints on NIC and Email
- `CHECK` constraints for data validation (stock_qty >= 0, valid blood groups, etc.)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Database | MySQL 8.0+ |
| Backend | Express.js (Node.js) |
| Frontend | React 18 + Vite |
| Authentication | JWT |
| Styling | CSS3 with Glassmorphism |
| API | RESTful |

## Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone/Setup Project
```bash
cd E:\NSBM\hms
```

### 2. Database Setup
```bash
# Connect to MySQL
mysql -u root -p

# Create database and schema
source database/schema.sql

# Insert seed data
source database/seed.sql

# Verify installation
source database/verify.sql
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
copy .env.example .env
# Edit .env with your database credentials

# Start server
npm run dev
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | password123 |
| Doctor | doctor | password123 |
| Pharmacist | pharmacist | password123 |
| Receptionist | receptionist | password123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Register new patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PATCH /api/appointments/:id/status` - Update status

### Pharmacy
- `GET /api/pharmacy` - List medicines
- `POST /api/pharmacy/dispense` - Dispense medicine
- `GET /api/pharmacy/low-stock` - Low stock alerts
- `GET /api/pharmacy/expiring` - Expiry alerts

### Billing
- `POST /api/billing/invoice` - Generate invoice
- `GET /api/billing` - List bills
- `POST /api/billing/payment` - Record payment

### Reports
- `GET /api/reports/dashboard` - Dashboard summary
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/patient-load` - Patient load report
- `GET /api/reports/inventory` - Inventory status

## Project Structure

```
hms/
├── database/
│   ├── schema.sql          # Complete DDL with all entities
│   ├── seed.sql            # Test data
│   └── verify.sql          # Verification queries
├── backend/
│   ├── config/
│   │   └── database.js     # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── doctorController.js
│   │   ├── pharmacyController.js
│   │   ├── appointmentController.js
│   │   ├── billingController.js
│   │   ├── wardController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── auth.js         # JWT & RBAC middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── patientRoutes.js
│   │   └── ...
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Sidebar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Patients.jsx
    │   │   ├── Pharmacy.jsx
    │   │   ├── Appointments.jsx
    │   │   ├── Doctors.jsx
    │   │   ├── Wards.jsx
    │   │   ├── Billing.jsx
    │   │   └── Reports.jsx
    │   ├── styles/
    │   │   └── index.css
    │   ├── utils/
    │   │   └── api.js
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

## Design Guidelines

### Color Scheme
- **Primary Teal**: #0097A7
- **Deep Blue**: #1565C0
- **Background**: #F4F6F9

### UI Style
- Modern Glassmorphism aesthetic
- Dark mode support
- Sidebar navigation
- Status badges (Green/Yellow/Red)
- Responsive design

## Key Business Logic

### Trigger-Based Inventory Deduction
When a medicine is dispensed, a database trigger automatically reduces the inventory stock. This ensures real-time accuracy without manual intervention.

```sql
CREATE TRIGGER trg_after_dispensing_insert
AFTER INSERT ON Dispensing
FOR EACH ROW
BEGIN
    UPDATE Inventory
    SET stock_quantity = stock_quantity - NEW.quantity_dispensed
    WHERE inventory_id = NEW.inventory_id;
END;
```

### Stored Procedure for Invoice Generation
Complex billing logic is encapsulated in stored procedures for consistency and performance.

### FEFO (First Expired First Out)
The pharmacy system automatically selects inventory batches with the earliest expiry date for dispensing.

## Verification

Run the verification script to ensure all features work correctly:
```bash
mysql -u root -p hms < database/verify.sql
```

## License

MIT License
