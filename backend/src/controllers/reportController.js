const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');

exports.getTicketReport = async (req, res, next) => {
  try {
    if (isMock()) {
      const tickets = mockDb.tickets;
      const byStatusMap = {};
      tickets.forEach(t => {
        byStatusMap[t.status] = (byStatusMap[t.status] || 0) + 1;
      });
      const byStatus = Object.keys(byStatusMap).map(s => ({ status: s, count: byStatusMap[s] }));
      
      const trend = [
        { date: '2026-09-20', count: 4 },
        { date: '2026-09-21', count: 8 },
        { date: '2026-09-22', count: 6 },
        { date: '2026-09-23', count: 12 },
        { date: '2026-09-24', count: 9 },
      ];

      return res.json({ success: true, byStatus, trend, avg_resolution_hours: 14 });
    }

    const { dateFrom, dateTo } = req.query;
    let where = '';
    const params = [];
    if (dateFrom) { where += ' AND t.created_at >= ?'; params.push(dateFrom); }
    if (dateTo) { where += ' AND t.created_at <= ?'; params.push(dateTo + ' 23:59:59'); }

    const [byStatus] = await pool.query(
      `SELECT t.status, COUNT(*) as count FROM tickets t WHERE 1=1${where} GROUP BY t.status`,
      params
    );

    const [trend] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM tickets
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const [[{ avg_resolution_hours }]] = await pool.query(
      `SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_resolution_hours
       FROM tickets WHERE resolved_at IS NOT NULL`
    );

    res.json({ success: true, byStatus, trend, avg_resolution_hours: Math.round(avg_resolution_hours || 0) });
  } catch (err) {
    next(err);
  }
};

exports.getCategoryReport = async (req, res, next) => {
  try {
    if (isMock()) {
      const data = mockDb.categories.map(c => {
        const catTickets = mockDb.tickets.filter(t => t.category_id === c.id);
        const resolved = catTickets.filter(t => t.status === 'resolved').length;
        const overdue = catTickets.filter(t => new Date(t.due_at) < new Date() && !['resolved', 'closed'].includes(t.status)).length;
        return {
          category_id: c.id,
          category_name: c.name,
          sla_hours: c.sla_hours,
          ticket_count: catTickets.length,
          resolved,
          overdue,
          avg_resolution_hours: 12
        };
      });
      return res.json({ success: true, report: data });
    }

    const [data] = await pool.query(
      `SELECT c.id as category_id, c.name as category_name, c.sla_hours,
              COUNT(t.id) as ticket_count,
              SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
              SUM(CASE WHEN t.status NOT IN ('resolved','closed') AND t.due_at < NOW() THEN 1 ELSE 0 END) as overdue,
              AVG(CASE WHEN t.resolved_at IS NOT NULL
                  THEN TIMESTAMPDIFF(HOUR, t.created_at, t.resolved_at)
                  END) as avg_resolution_hours
       FROM categories c
       LEFT JOIN tickets t ON c.id = t.category_id
       GROUP BY c.id, c.name, c.sla_hours`
    );
    res.json({ success: true, report: data });
  } catch (err) {
    next(err);
  }
};

exports.getStaffWorkload = async (req, res, next) => {
  try {
    if (isMock()) {
      const staffList = mockDb.users.filter(u => u.role === 'staff');
      const data = staffList.map(s => {
        const sTickets = mockDb.tickets.filter(t => t.assigned_to === s.id);
        return {
          staff_id: s.id,
          staff_name: s.name,
          department_name: s.department_name || 'Academic Operations',
          active_tickets: sTickets.filter(t => !['resolved', 'closed'].includes(t.status)).length,
          resolved_tickets: sTickets.filter(t => t.status === 'resolved').length,
          total_tickets: sTickets.length
        };
      });
      return res.json({ success: true, workload: data });
    }

    const [data] = await pool.query(
      `SELECT u.id as staff_id, u.name as staff_name, d.name as department_name,
              COUNT(CASE WHEN t.status NOT IN ('resolved','closed') THEN 1 END) as active_tickets,
              COUNT(CASE WHEN t.status = 'resolved' THEN 1 END) as resolved_tickets,
              COUNT(t.id) as total_tickets
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN tickets t ON u.id = t.assigned_to
       WHERE u.role = 'staff' AND u.is_active = TRUE
       GROUP BY u.id, u.name, d.name`
    );
    res.json({ success: true, workload: data });
  } catch (err) {
    next(err);
  }
};

exports.getSLAReport = async (req, res, next) => {
  try {
    if (isMock()) {
      const tickets = mockDb.tickets;
      const total = tickets.length;
      const breached = tickets.filter(t => new Date(t.due_at) < new Date() && !['resolved', 'closed'].includes(t.status)).length;
      const compliance = total > 0 ? Math.round(((total - breached) / total) * 100) : 95;

      return res.json({
        success: true,
        sla: {
          complianceRate: compliance,
          total,
          breached,
          within: total - breached,
          dueSoon: 1,
        }
      });
    }

    const [[{ total, breached }]] = await pool.query(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN due_at < NOW() AND status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as breached
       FROM tickets`
    );

    const compliance = total > 0 ? Math.round(((total - breached) / total) * 100) : 95;

    res.json({
      success: true,
      sla: {
        complianceRate: compliance,
        total,
        breached
      }
    });
  } catch (err) {
    next(err);
  }
};
