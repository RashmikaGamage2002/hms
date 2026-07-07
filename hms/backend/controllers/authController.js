import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h'
  });
};

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Get user with role entity info
    const users = await query(
      `SELECT u.*, p.first_name, p.last_name, p.email, p.nic
       FROM UserAccount u
       JOIN Person p ON u.person_id = p.person_id
       WHERE u.username = ?`,
      [username]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({
        success: false,
        message: `Account is locked until ${new Date(user.locked_until).toLocaleString()}`
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed attempts
      await query(
        `UPDATE UserAccount SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?`,
        [user.user_id]
      );

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset failed attempts and update last login
    await query(
      `UPDATE UserAccount
       SET failed_login_attempts = 0, last_login = NOW(), locked_until = NULL
       WHERE user_id = ?`,
      [user.user_id]
    );

    // Get role entity ID for additional permissions
    let roleEntityId = user.role_entity_id;

    // Generate tokens
    const token = generateToken(user.user_id, user.role);
    const refreshToken = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.user_id,
          username: user.username,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          personId: user.person_id
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Register new user (Admin only)
export const register = async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      personId,
      roleEntityId
    } = req.body;

    // Validate required fields
    if (!username || !password || !role || !personId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Doctor', 'Pharmacist', 'Receptionist'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if username exists
    const existingUsers = await query(
      `SELECT user_id FROM UserAccount WHERE username = ?`,
      [username]
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query(
      `INSERT INTO UserAccount (username, password_hash, role, person_id, role_entity_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, passwordHash, role, personId, roleEntityId]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.insertId,
        username
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Get additional role-specific info
    let roleInfo = null;
    switch (user.role) {
      case 'Doctor':
        const doctors = await query(`SELECT * FROM Doctor WHERE doctor_id = ?`, [user.userId]);
        roleInfo = doctors[0];
        break;
      case 'Pharmacist':
        const pharmacists = await query(`SELECT * FROM Pharmacist WHERE pharmacist_id = ?`, [user.userId]);
        roleInfo = pharmacists[0];
        break;
      case 'Receptionist':
        const receptionists = await query(`SELECT * FROM Receptionist WHERE receptionist_id = ?`, [user.userId]);
        roleInfo = receptionists[0];
        break;
      case 'Admin':
        const admins = await query(`SELECT * FROM Admin WHERE admin_id = ?`, [user.userId]);
        roleInfo = admins[0];
        break;
    }

    res.json({
      success: true,
      data: {
        ...user,
        roleInfo
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    // Get current password hash
    const users = await query(
      `SELECT password_hash FROM UserAccount WHERE user_id = ?`,
      [req.user.userId]
    );

    const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await query(
      `UPDATE UserAccount
       SET password_hash = ?, password_changed_at = NOW(), must_change_password = FALSE
       WHERE user_id = ?`,
      [newHash, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Logout (client should discard token, this is for audit)
export const logout = async (req, res) => {
  try {
    // Could add token to blacklist here if using database-backed sessions
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const users = await query(
      `SELECT u.role, u.is_active FROM UserAccount u WHERE u.user_id = ?`,
      [decoded.userId]
    );

    if (!users || users.length === 0 || !users[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const newToken = generateToken(decoded.userId, users[0].role);

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};
