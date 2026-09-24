const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');
const { createNotification } = require('../services/notificationService');

exports.createNotification = createNotification;

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isMock()) {
      let list = mockDb.notifications.filter(n => n.user_id === userId || req.user.role === 'staff' || req.user.role === 'manager');
      const unread_count = list.filter(n => !n.is_read).length;
      return res.json({
        success: true,
        notifications: list,
        total: list.length,
        unreadCount: unread_count,
        unread_count,
        page: 1,
        totalPages: 1,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    let whereClause = 'WHERE n.user_id = ?';
    const params = [userId];
    if (unreadOnly) {
      whereClause += ' AND n.is_read = FALSE';
    }

    const [notifications] = await pool.query(
      `SELECT n.*, t.ticket_number
       FROM notifications n
       LEFT JOIN tickets t ON n.ticket_id = t.id
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?${unreadOnly ? ' AND is_read = FALSE' : ''}`,
      [userId]
    );

    const [[{ unread_count }]] = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      notifications,
      total,
      unreadCount: unread_count,
      unread_count,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isMock()) {
      const notif = mockDb.notifications.find(n => String(n.id) === String(id));
      if (notif) notif.is_read = true;
      return res.json({ success: true, message: 'Notification marked as read' });
    }

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (isMock()) {
      mockDb.notifications.forEach(n => { if (n.user_id === userId) n.is_read = true; });
      return res.json({ success: true, message: 'All notifications marked as read' });
    }
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};
