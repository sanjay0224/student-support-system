const { pool, isMock } = require('../config/database');

const SLA_HOURS = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48,
};

exports.getSLAHours = (priority) => SLA_HOURS[priority] || 24;

exports.getSLAStatus = (ticket) => {
  if (!ticket.due_at) return 'within_sla';
  const due = new Date(ticket.due_at).getTime();
  const now = Date.now();
  if (now > due) return 'breached';
  if (due - now < 2 * 60 * 60 * 1000) return 'due_soon';
  return 'within_sla';
};

exports.getDueAt = (createdAt, slaHours) => {
  const d = new Date(createdAt);
  d.setHours(d.getHours() + slaHours);
  return d;
};

exports.getAge = (createdAt) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff / (1000 * 60 * 60);
};

exports.formatDuration = (hours) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remaining = Math.round(hours % 24);
  return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`;
};

exports.checkAndUpdateSLABreaches = async () => {
  if (isMock()) {
    console.log('[SLA Cron] Running in mock mode - skipping DB operations');
    return;
  }
  try {
    const [overdueTickets] = await pool.query(`
      SELECT t.id, t.ticket_number, t.student_id, t.assigned_to, t.due_at
      FROM tickets t
      WHERE t.status NOT IN ('resolved', 'closed')
        AND t.due_at IS NOT NULL
        AND t.due_at < NOW()
        AND t.escalated_at IS NULL
    `);

    for (const ticket of overdueTickets) {
      const [existing] = await pool.query(
        'SELECT id FROM escalations WHERE ticket_id = ? AND status = "open"',
        [ticket.id]
      );
      if (existing.length === 0) {
        const [managers] = await pool.query(
          'SELECT id FROM users WHERE role = "manager" AND is_active = TRUE LIMIT 1'
        );
        if (managers.length > 0) {
          const managerId = managers[0].id;
          await pool.query(
            `INSERT INTO escalations (ticket_id, escalated_by, escalated_to, reason, status)
             VALUES (?, ?, ?, ?, 'open')`,
            [ticket.id, ticket.assigned_to || ticket.student_id, managerId, 'SLA breach - automated escalation']
          );
          await pool.query('UPDATE tickets SET escalated_at = NOW() WHERE id = ?', [ticket.id]);
        }
      }
    }
    console.log(`[SLA Cron] Checked ${overdueTickets.length} overdue tickets`);
  } catch (err) {
    console.error('[SLA Cron] Error:', err.message);
  }
};
