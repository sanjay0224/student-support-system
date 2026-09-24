const { pool, isMock } = require('../config/database');
const mockDb = require('./mockDb');

const createNotification = async (userId, ticketId, title, message, type) => {
  try {
    if (isMock()) {
      mockDb.notifications.unshift({
        id: Date.now(),
        user_id: userId,
        ticket_id: ticketId,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date().toISOString()
      });
      return;
    }
    await pool.query(
      `INSERT INTO notifications (user_id, ticket_id, title, message, type) VALUES (?, ?, ?, ?, ?)`,
      [userId, ticketId, title, message, type]
    );
  } catch (err) {
    console.error('[NotificationService] Failed:', err.message);
  }
};

const notifyStudent = async (studentId, ticketId, ticketNumber, type, title, message) => {
  await createNotification(studentId, ticketId, title, message, type);
  console.log(`[NOTIFY STUDENT #${studentId}] ${title}: ${message.substring(0, 80)}`);
};

const notifyStaff = async (staffId, ticketId, ticketNumber, type, title, message) => {
  await createNotification(staffId, ticketId, title, message, type);
  console.log(`[NOTIFY STAFF #${staffId}] ${title}: ${message.substring(0, 80)}`);
};

const notifyManagers = async (ticketId, ticketNumber, type, title, message) => {
  if (isMock()) {
    const managers = mockDb.users.filter(u => u.role === 'manager');
    for (const m of managers) {
      await createNotification(m.id, ticketId, title, message, type);
    }
    return;
  }
  const [managers] = await pool.query('SELECT id FROM users WHERE role = "manager" AND is_active = TRUE');
  for (const m of managers) {
    await createNotification(m.id, ticketId, title, message, type);
  }
};

module.exports = {
  createNotification,
  notifyStudent,
  notifyStaff,
  notifyManagers,
};
