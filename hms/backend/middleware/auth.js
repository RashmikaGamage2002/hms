import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Verify JWT token
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const user = await query(
      `SELECT u.user_id, u.username, u.role, u.is_active, p.person_id, p.first_name, p.last_name, p.email
       FROM UserAccount u
       JOIN Person p ON u.person_id = p.person_id
       WHERE u.user_id = ?`,
      [decoded.userId]
    );

    if (!user || user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    req.user = {
      userId: user[0].user_id,
      username: user[0].username,
      role: user[0].role,
      personId: user[0].person_id,
      firstName: user[0].first_name,
      lastName: user[0].last_name,
      email: user[0].email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    next(error);
  }
};

// Role-based access control
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};

// Check if user has specific role entity
export const checkRoleEntity = async (req, res, next) => {
  try {
    const { role } = req.user;
    let entityTable;

    switch (role) {
      case 'Doctor':
        entityTable = 'Doctor';
        break;
      case 'Pharmacist':
        entityTable = 'Pharmacist';
        break;
      case 'Receptionist':
        entityTable = 'Receptionist';
        break;
      case 'Admin':
        entityTable = 'Admin';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
    }

    const result = await query(
      `SELECT * FROM ${entityTable} WHERE ${entityTable.toLowerCase()}_id = ?`,
      [req.user.userId]
    );

    if (!result || result.length === 0) {
      return res.status(403).json({
        success: false,
        message: `${role} profile not found`
      });
    }

    req.roleEntity = result[0];
    next();
  } catch (error) {
    next(error);
  }
};

// Log audit trail
export const logAudit = async (req, res, next) => {
  // Store original end function
  const originalEnd = res.end;

  res.end = function (data, encoding) {
    // Log audit asynchronously (don't block response)
    (async () => {
      try {
        if (req.user && req.method !== 'GET') {
          await query(
            `INSERT INTO AuditLog (user_id, action, table_name, ip_address)
             VALUES (?, ?, ?, ?)`,
            [req.user.userId, `${req.method} ${req.path}`, req.tableName || 'Unknown', req.ip]
          );
        }
      } catch (error) {
        console.error('Audit log error:', error.message);
      }
    })();

    originalEnd.call(this, data, encoding);
  };

  next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await query(
        `SELECT u.user_id, u.username, u.role, u.is_active, p.person_id, p.first_name, p.last_name
         FROM UserAccount u
         JOIN Person p ON u.person_id = p.person_id
         WHERE u.user_id = ?`,
        [decoded.userId]
      );

      if (user && user.length > 0 && user[0].is_active) {
        req.user = {
          userId: user[0].user_id,
          username: user[0].username,
          role: user[0].role,
          personId: user[0].person_id,
          firstName: user[0].first_name,
          lastName: user[0].last_name
        };
      }
    }
  } catch (error) {
    // Silently fail - optional auth
  }
  next();
};
