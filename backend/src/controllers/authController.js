const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = null;

    if (isMock()) {
      user = mockDb.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
      if (!user) {
        // Fallback for demo buttons
        if (email.includes('student')) user = mockDb.users.find(u => u.role === 'student');
        else if (email.includes('staff')) user = mockDb.users.find(u => u.role === 'staff');
        else if (email.includes('manager')) user = mockDb.users.find(u => u.role === 'manager');
      }
    } else {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) user = users[0];
    }
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // In mock mode or real mode, check password
    let isMatch = false;
    if (user.password_hash) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    }
    // Allow demo convenience in mock mode if password is 'password123' or 'Student@123' or any password
    if (isMock() && !isMatch) {
      isMatch = true; // Auto-pass for demo buttons in fallback mode
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id || null
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    if (isMock()) {
      const user = mockDb.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, department_id: user.department_id }
      });
    }
    const [users] = await pool.query('SELECT id, name, email, role, department_id, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: users[0] });
  } catch (err) {
    next(err);
  }
};
