const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');
const { getSLAStatus } = require('../services/slaService');

exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    if (isMock()) {
      const tickets = mockDb.tickets.filter(t => t.student_id === studentId || req.user.email.includes('student'));
      const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
      tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

      return res.json({
        success: true,
        stats: { total: tickets.length, ...counts },
        recentTickets: tickets.slice(0, 5).map(t => ({ ...t, sla_status: getSLAStatus(t) })),
        unread_notifications: mockDb.notifications.filter(n => n.user_id === studentId && !n.is_read).length,
      });
    }

    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as count FROM tickets WHERE student_id = ? GROUP BY status`,
      [studentId]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM tickets WHERE student_id = ?',
      [studentId]
    );

    const [recentTickets] = await pool.query(
      `SELECT t.*, c.name as category_name, ua.name as assigned_name,
              TIMESTAMPDIFF(HOUR, t.created_at, NOW()) as age_hours
       FROM tickets t
       JOIN categories c ON t.category_id = c.id
       LEFT JOIN users ua ON t.assigned_to = ua.id
       WHERE t.student_id = ?
       ORDER BY t.created_at DESC LIMIT 5`,
      [studentId]
    );

    const [[{ unread_notifications }]] = await pool.query(
      'SELECT COUNT(*) as unread_notifications FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [studentId]
    );

    const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
    statusCounts.forEach(r => { counts[r.status] = r.count; });

    res.json({
      success: true,
      stats: { total, ...counts },
      recentTickets: recentTickets.map(t => ({ ...t, sla_status: getSLAStatus(t) })),
      unread_notifications,
    });
  } catch (err) {
    next(err);
  }
};

exports.getStaffDashboard = async (req, res, next) => {
  try {
    const staffId = req.user.id;

    if (isMock()) {
      const tickets = mockDb.tickets.filter(t => t.assigned_to === staffId || req.user.email.includes('staff'));
      const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
      tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

      const overdue = tickets.filter(t => new Date(t.due_at) < new Date() && !['resolved', 'closed'].includes(t.status)).length;
      const dueSoon = tickets.filter(t => {
        const diff = new Date(t.due_at).getTime() - new Date().getTime();
        return diff > 0 && diff < 2 * 3600 * 1000 && !['resolved', 'closed'].includes(t.status);
      }).length;

      return res.json({
        success: true,
        stats: { total: tickets.length, assignedToMe: tickets.length, overdue, dueSoon, ...counts },
        recentTickets: tickets.filter(t => !['resolved', 'closed'].includes(t.status)).slice(0, 10).map(t => ({ ...t, sla_status: getSLAStatus(t) })),
        unread_notifications: mockDb.notifications.filter(n => n.user_id === staffId && !n.is_read).length,
      });
    }

    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) as count FROM tickets WHERE assigned_to = ? GROUP BY status`,
      [staffId]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM tickets WHERE assigned_to = ?',
      [staffId]
    );

    const [[{ overdue }]] = await pool.query(
      `SELECT COUNT(*) as overdue FROM tickets
       WHERE assigned_to = ? AND due_at < NOW() AND status NOT IN ('resolved','closed')`,
      [staffId]
    );

    const [[{ due_soon }]] = await pool.query(
      `SELECT COUNT(*) as due_soon FROM tickets
       WHERE assigned_to = ?
         AND due_at > NOW()
         AND due_at < DATE_ADD(NOW(), INTERVAL 2 HOUR)
         AND status NOT IN ('resolved','closed')`,
      [staffId]
    );

    const [recentTickets] = await pool.query(
      `SELECT t.*, c.name as category_name, us.name as student_name,
              TIMESTAMPDIFF(HOUR, t.created_at, NOW()) as age_hours
       FROM tickets t
       JOIN categories c ON t.category_id = c.id
       JOIN users us ON t.student_id = us.id
       WHERE t.assigned_to = ? AND t.status NOT IN ('resolved','closed')
       ORDER BY t.due_at ASC LIMIT 10`,
      [staffId]
    );

    const [[{ unread_notifications }]] = await pool.query(
      'SELECT COUNT(*) as unread_notifications FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [staffId]
    );

    const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
    statusCounts.forEach(r => { counts[r.status] = r.count; });

    res.json({
      success: true,
      stats: { total, assignedToMe: total, overdue, dueSoon: due_soon, ...counts },
      recentTickets: recentTickets.map(t => ({ ...t, sla_status: getSLAStatus(t) })),
      unread_notifications,
    });
  } catch (err) {
    next(err);
  }
};

exports.getManagerDashboard = async (req, res, next) => {
  try {
    if (isMock()) {
      const tickets = mockDb.tickets;
      const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
      tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

      const overdue = tickets.filter(t => new Date(t.due_at) < new Date() && !['resolved', 'closed'].includes(t.status)).length;
      const escalations = mockDb.escalations.filter(e => e.status === 'open').length;

      const staffWorkload = mockDb.users.filter(u => u.role === 'staff').map(staff => {
        const staffTickets = tickets.filter(t => t.assigned_to === staff.id);
        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          active_tickets: staffTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
          total_tickets: staffTickets.length
        };
      });

      const recentEscalations = mockDb.escalations.slice(0, 5).map(e => {
        const t = tickets.find(tk => tk.id === e.ticket_id);
        return {
          ...e,
          ticket_number: t ? t.ticket_number : 'TKT-2026-0002',
          subject: t ? t.subject : 'Escalated Request',
          priority: t ? t.priority : 'critical'
        };
      });

      return res.json({
        success: true,
        stats: { total: tickets.length, ...counts, overdue, slaBreaches: overdue, escalations },
        staffWorkload,
        recentEscalations,
        unread_notifications: mockDb.notifications.filter(n => n.user_id === req.user.id && !n.is_read).length,
      });
    }

    const [statusCounts] = await pool.query(
      'SELECT status, COUNT(*) as count FROM tickets GROUP BY status'
    );

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM tickets');

    const [[{ overdue }]] = await pool.query(
      `SELECT COUNT(*) as overdue FROM tickets
       WHERE due_at < NOW() AND status NOT IN ('resolved','closed')`
    );

    const [[{ sla_breached }]] = await pool.query(
      `SELECT COUNT(*) as sla_breached FROM tickets
       WHERE due_at < NOW() AND status NOT IN ('resolved','closed')`
    );

    const [[{ escalations }]] = await pool.query(
      `SELECT COUNT(*) as escalations FROM escalations WHERE status = 'open'`
    );

    const [staffWorkload] = await pool.query(
      `SELECT u.id, u.name, u.email,
              COUNT(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 END) as active_tickets,
              COUNT(t.id) as total_tickets
       FROM users u
       LEFT JOIN tickets t ON u.id = t.assigned_to
       WHERE u.role = 'staff' AND u.is_active = TRUE
       GROUP BY u.id, u.name, u.email`
    );

    const [recentEscalations] = await pool.query(
      `SELECT e.*, t.ticket_number, t.subject, t.priority, ub.name as escalated_by_name
       FROM escalations e
       JOIN tickets t ON e.ticket_id = t.id
       JOIN users ub ON e.escalated_by = ub.id
       WHERE e.status = 'open'
       ORDER BY e.created_at DESC LIMIT 5`
    );

    const [[{ unread_notifications }]] = await pool.query(
      'SELECT COUNT(*) as unread_notifications FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    const counts = { open: 0, assigned: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 };
    statusCounts.forEach(r => { counts[r.status] = r.count; });

    res.json({
      success: true,
      stats: { total, ...counts, overdue, slaBreaches: sla_breached, escalations },
      staffWorkload,
      recentEscalations,
      unread_notifications,
    });
  } catch (err) {
    next(err);
  }
};
