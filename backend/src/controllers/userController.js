const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');
const bcrypt = require('bcryptjs');

exports.getStaffList = async (req, res, next) => {
  try {
    if (isMock()) {
      const staff = mockDb.users.filter(u => u.role === 'staff' || u.role === 'manager').map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_active: true,
        department_name: 'Academic Affairs',
        active_tickets: mockDb.tickets.filter(t => t.assigned_to === u.id && !['resolved', 'closed'].includes(t.status)).length
      }));
      return res.json({ success: true, staff });
    }

    const [staff] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, d.name as department_name,
              COUNT(t.id) as active_tickets
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status NOT IN ('resolved','closed')
       WHERE u.role IN ('staff','manager') AND u.is_active = TRUE
       GROUP BY u.id, u.name, u.email, u.role, u.is_active, d.name
       ORDER BY u.name`,
    );
    res.json({ success: true, staff });
  } catch (err) {
    next(err);
  }
};

exports.getAllStaff = async (req, res, next) => {
  try {
    if (isMock()) {
      const staff = mockDb.users.filter(u => u.role === 'staff').map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_active: true,
        department_name: 'Academic Affairs',
        active_tickets: mockDb.tickets.filter(t => t.assigned_to === u.id && !['resolved', 'closed'].includes(t.status)).length,
        resolved_tickets: mockDb.tickets.filter(t => t.assigned_to === u.id && t.status === 'resolved').length
      }));
      return res.json({ success: true, staff });
    }

    const [staff] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, d.name as department_name,
              COUNT(t.id) as active_tickets,
              SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN tickets t ON u.id = t.assigned_to
       WHERE u.role = 'staff'
       GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.created_at, d.name
       ORDER BY active_tickets DESC`
    );
    res.json({ success: true, staff });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    if (isMock()) {
      const u = mockDb.users.find(user => user.id === req.user.id) || req.user;
      return res.json({ success: true, user: { id: u.id, name: u.name, email: u.email, role: u.role, is_active: true, department_name: 'Campus Admin' } });
    }

    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.avatar_url, u.created_at,
              d.name as department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Name is required' });

    if (isMock()) {
      const u = mockDb.users.find(user => user.id === req.user.id);
      if (u) u.name = name.trim();
      return res.json({ success: true, message: 'Profile updated' });
    }

    await pool.query(
      'UPDATE users SET name = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), req.user.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (isMock()) {
      return res.json({ success: true, message: 'Password changed successfully' });
    }

    const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};
