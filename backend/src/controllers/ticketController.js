const { pool, isMock } = require('../config/database');
const mockDb = require('../services/mockDb');
const { getSLAHours, getDueAt, getSLAStatus, getAge } = require('../services/slaService');

const VALID_TRANSITIONS = {
  open: ['assigned'],
  assigned: ['in_progress', 'open'],
  in_progress: ['pending', 'resolved'],
  pending: ['in_progress', 'resolved'],
  resolved: ['closed', 'open'],
  closed: [],
};

const logActivity = async (ticketId, userId, action, description, oldValue = null, newValue = null) => {
  if (isMock()) {
    const u = mockDb.users.find(x => x.id === userId);
    mockDb.activities.unshift({
      id: Date.now(),
      ticket_id: Number(ticketId),
      user_id: userId,
      user_name: u?.name || 'User',
      user_role: u?.role || 'staff',
      action,
      old_value: oldValue,
      new_value: newValue,
      description,
      created_at: new Date().toISOString()
    });
    return;
  }
  await pool.query(
    `INSERT INTO ticket_activity (ticket_id, user_id, action, old_value, new_value, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [ticketId, userId, action, oldValue, newValue, description]
  );
};

exports.createTicket = async (req, res, next) => {
  try {
    const { categoryId, subject, description, priority } = req.body;
    const studentId = req.user.id;

    if (!categoryId || !subject?.trim() || !description?.trim() || !priority) {
      return res.status(400).json({ success: false, message: 'categoryId, subject, description, and priority are required' });
    }

    if (isMock()) {
      const cat = mockDb.categories.find(c => c.id === Number(categoryId)) || mockDb.categories[0];
      const student = mockDb.users.find(u => u.id === studentId) || req.user;
      const tId = mockDb.tickets.length + 101;
      const tNum = `TKT-2026-00${mockDb.tickets.length + 1}`;
      const slaH = getSLAHours(priority);
      const dueAt = getDueAt(new Date(), slaH).toISOString();

      const newT = {
        id: tId,
        ticket_number: tNum,
        student_id: studentId,
        student_name: student.name,
        student_email: student.email,
        category_id: Number(categoryId),
        category_name: cat.name,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        status: 'open',
        assigned_to: null,
        assigned_to_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        due_at: dueAt,
        resolved_at: null,
        closed_at: null,
        escalated_at: null,
        escalation_reason: null,
        resolution_comment: null
      };

      mockDb.tickets.unshift(newT);
      await logActivity(tId, studentId, 'created', `Ticket ${tNum} created by student`);
      return res.status(201).json({ success: true, message: 'Ticket created', ticket: newT });
    }

    // Real MySQL execution
    const [[category]] = await pool.query('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM tickets WHERE YEAR(created_at) = YEAR(NOW())');
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    const slaHours = getSLAHours(priority);
    const dueAt = getDueAt(new Date(), slaHours);

    const [result] = await pool.query(
      `INSERT INTO tickets (ticket_number, student_id, category_id, subject, description, priority, status, due_at)
       VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`,
      [ticketNumber, studentId, categoryId, subject.trim(), description.trim(), priority, dueAt]
    );

    const ticketId = result.insertId;
    await logActivity(ticketId, studentId, 'created', `Ticket ${ticketNumber} created by student`);

    const [[ticket]] = await pool.query(
      `SELECT t.*, c.name as category_name, u.name as student_name
       FROM tickets t JOIN categories c ON t.category_id = c.id JOIN users u ON t.student_id = u.id
       WHERE t.id = ?`, [ticketId]
    );

    res.status(201).json({ success: true, message: 'Ticket created', ticket });
  } catch (err) {
    next(err);
  }
};

exports.getTickets = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { status, category, priority, assignedTo, search, sortBy = 'newest', page = 1, limit = 20, slaStatus } = req.query;

    if (isMock()) {
      let list = [...mockDb.tickets];

      if (role === 'student') {
        list = list.filter(t => t.student_id === userId || req.user.email.includes('student'));
      } else if (role === 'staff') {
        list = list.filter(t => t.assigned_to === userId || t.status === 'open' || !t.assigned_to);
      }

      if (status) list = list.filter(t => t.status === status);
      if (category) list = list.filter(t => t.category_name?.toLowerCase() === category.toLowerCase());
      if (priority) list = list.filter(t => t.priority === priority);
      if (assignedTo) list = list.filter(t => String(t.assigned_to) === String(assignedTo));
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(t => t.ticket_number.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
      }

      let enriched = list.map(t => ({ ...t, sla_status: getSLAStatus(t) }));
      if (slaStatus) enriched = enriched.filter(t => t.sla_status === slaStatus);

      if (sortBy === 'newest') enriched.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (sortBy === 'oldest') enriched.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 20;
      const start = (pageNum - 1) * limitNum;
      const paginated = enriched.slice(start, start + limitNum);

      return res.json({
        success: true,
        tickets: paginated,
        total: enriched.length,
        page: pageNum,
        totalPages: Math.ceil(enriched.length / limitNum),
      });
    }

    // Real MySQL fallback logic
    let conditions = [];
    let params = [];

    if (role === 'student') {
      conditions.push('t.student_id = ?');
      params.push(userId);
    } else if (role === 'staff') {
      conditions.push('(t.assigned_to = ? OR (t.assigned_to IS NULL AND t.status = "open"))');
      params.push(userId);
    }

    if (status) { conditions.push('t.status = ?'); params.push(status); }
    if (category) { conditions.push('c.name = ?'); params.push(category); }
    if (priority) { conditions.push('t.priority = ?'); params.push(priority); }
    if (assignedTo) { conditions.push('t.assigned_to = ?'); params.push(assignedTo); }
    if (search) {
      conditions.push('(t.ticket_number LIKE ? OR t.subject LIKE ? OR t.description LIKE ? OR us.name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    const [tickets] = await pool.query(
      `SELECT t.*, c.name as category_name, us.name as student_name, us.email as student_email, ua.name as assigned_name
       FROM tickets t JOIN categories c ON t.category_id = c.id JOIN users us ON t.student_id = us.id LEFT JOIN users ua ON t.assigned_to = ua.id
       ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM tickets t JOIN categories c ON t.category_id = c.id JOIN users us ON t.student_id = us.id LEFT JOIN users ua ON t.assigned_to = ua.id ${where}`,
      params
    );

    let enriched = tickets.map(t => ({ ...t, sla_status: getSLAStatus(t) }));
    if (slaStatus) enriched = enriched.filter(t => t.sla_status === slaStatus);

    res.json({ success: true, tickets: enriched, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
};

exports.getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      let msgs = mockDb.messages.filter(m => String(m.ticket_id) === String(id));
      if (role === 'student') msgs = msgs.filter(m => m.message_type === 'reply');

      const activity = mockDb.activities.filter(a => String(a.ticket_id) === String(id));
      const escalations = mockDb.escalations.filter(e => String(e.ticket_id) === String(id));

      return res.json({
        success: true,
        ticket: {
          ...ticket,
          sla_status: getSLAStatus(ticket),
          messages: msgs,
          activity,
          escalations
        }
      });
    }

    const [[ticket]] = await pool.query(
      `SELECT t.*, c.name as category_name, c.sla_hours, us.name as student_name, us.email as student_email, ua.name as assigned_name
       FROM tickets t JOIN categories c ON t.category_id = c.id JOIN users us ON t.student_id = us.id LEFT JOIN users ua ON t.assigned_to = ua.id
       WHERE t.id = ?`, [id]
    );

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    let msgQuery = `SELECT tm.*, u.name as sender_name, u.role as sender_role FROM ticket_messages tm JOIN users u ON tm.sender_id = u.id WHERE tm.ticket_id = ?`;
    if (role === 'student') msgQuery += ` AND tm.message_type = 'reply'`;
    msgQuery += ' ORDER BY tm.created_at ASC';
    const [messages] = await pool.query(msgQuery, [id]);

    const [activity] = await pool.query(
      `SELECT ta.*, u.name as user_name, u.role as user_role FROM ticket_activity ta JOIN users u ON ta.user_id = u.id WHERE ta.ticket_id = ? ORDER BY ta.created_at DESC`, [id]
    );

    const [escalations] = await pool.query(
      `SELECT e.*, ub.name as escalated_by_name FROM escalations e JOIN users ub ON e.escalated_by = ub.id WHERE e.ticket_id = ? ORDER BY e.created_at DESC`, [id]
    );

    res.json({
      success: true,
      ticket: {
        ...ticket,
        sla_status: getSLAStatus(ticket),
        messages,
        activity,
        escalations
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body; // Accepts message or content
    const contentText = message || req.body.content;
    const { id: userId, role, name } = req.user;

    if (!contentText?.trim()) return res.status(400).json({ success: false, message: 'Reply content is required' });

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      if (ticket.status === 'resolved' && role === 'student') {
        ticket.status = 'in_progress';
        ticket.resolved_at = null;
        await logActivity(id, userId, 'reopened', 'Ticket reopened due to student reply');
      }

      const msgObj = {
        id: Date.now(),
        ticket_id: Number(id),
        sender_id: userId,
        sender_name: name || 'User',
        sender_role: role,
        message_type: 'reply',
        content: contentText.trim(),
        created_at: new Date().toISOString()
      };
      mockDb.messages.push(msgObj);
      await logActivity(id, userId, 'replied', `${role === 'student' ? 'Student' : 'Staff'} added a reply`);

      return res.status(201).json({ success: true, message: 'Reply added', reply: msgObj });
    }

    const [[ticket]] = await pool.query('SELECT * FROM tickets WHERE id = ?', [id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const [result] = await pool.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message_type, content) VALUES (?, ?, "reply", ?)',
      [id, userId, contentText.trim()]
    );
    await logActivity(id, userId, 'replied', 'Reply added');

    const [[msg]] = await pool.query(
      `SELECT tm.*, u.name as sender_name, u.role as sender_role FROM ticket_messages tm JOIN users u ON tm.sender_id = u.id WHERE tm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Reply added', reply: msg });
  } catch (err) {
    next(err);
  }
};

exports.addInternalNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const contentText = message || req.body.content;
    const { id: userId, role, name } = req.user;

    if (!contentText?.trim()) return res.status(400).json({ success: false, message: 'Note content is required' });

    if (isMock()) {
      const noteObj = {
        id: Date.now(),
        ticket_id: Number(id),
        sender_id: userId,
        sender_name: name || 'Staff Member',
        sender_role: role,
        message_type: 'internal_note',
        content: contentText.trim(),
        created_at: new Date().toISOString()
      };
      mockDb.messages.push(noteObj);
      await logActivity(id, userId, 'internal_note', 'Internal note added');
      return res.status(201).json({ success: true, message: 'Internal note added', note: noteObj });
    }

    const [result] = await pool.query(
      'INSERT INTO ticket_messages (ticket_id, sender_id, message_type, content) VALUES (?, ?, "internal_note", ?)',
      [id, userId, contentText.trim()]
    );
    await logActivity(id, userId, 'internal_note', 'Internal note added');
    const [[note]] = await pool.query(`SELECT tm.*, u.name as sender_name, u.role as sender_role FROM ticket_messages tm JOIN users u ON tm.sender_id = u.id WHERE tm.id = ?`, [result.insertId]);

    res.status(201).json({ success: true, message: 'Internal note added', note });
  } catch (err) {
    next(err);
  }
};

exports.assignTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo, staffId } = req.body;
    const targetStaffId = assignedTo || staffId;
    const { id: userId } = req.user;

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      const staff = mockDb.users.find(u => u.id === Number(targetStaffId)) || { name: 'Assigned Staff' };
      ticket.assigned_to = Number(targetStaffId);
      ticket.assigned_to_name = staff.name;
      if (ticket.status === 'open') ticket.status = 'assigned';

      await logActivity(id, userId, 'assigned', `Ticket assigned to ${staff.name}`);
      return res.json({ success: true, message: 'Ticket assigned', assignedTo: staff.name });
    }

    const [[staff]] = await pool.query('SELECT * FROM users WHERE id = ?', [targetStaffId]);
    await pool.query("UPDATE tickets SET assigned_to = ?, status = IF(status = 'open', 'assigned', status), updated_at = NOW() WHERE id = ?", [targetStaffId, id]);
    await logActivity(id, userId, 'assigned', `Ticket assigned to ${staff ? staff.name : targetStaffId}`);
    res.json({ success: true, message: 'Ticket assigned', assignedTo: staff ? staff.name : 'Staff' });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { id: userId } = req.user;

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

      ticket.status = status;
      ticket.updated_at = new Date().toISOString();
      await logActivity(id, userId, 'status_changed', `Status updated to ${status}`);
      return res.json({ success: true, message: 'Status updated', status });
    }

    await pool.query('UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    await logActivity(id, userId, 'status_changed', `Status updated to ${status}`);
    res.json({ success: true, message: 'Status updated', status });
  } catch (err) {
    next(err);
  }
};

exports.updatePriority = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const { id: userId } = req.user;

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      ticket.priority = priority;
      await logActivity(id, userId, 'priority_changed', `Priority changed to ${priority}`);
      return res.json({ success: true, message: 'Priority updated', priority });
    }

    await pool.query('UPDATE tickets SET priority = ?, updated_at = NOW() WHERE id = ?', [priority, id]);
    await logActivity(id, userId, 'priority_changed', `Priority changed to ${priority}`);
    res.json({ success: true, message: 'Priority updated', priority });
  } catch (err) {
    next(err);
  }
};

exports.resolveTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionComment } = req.body;
    const { id: userId } = req.user;

    if (!resolutionComment?.trim()) return res.status(400).json({ success: false, message: 'Resolution comment is required' });

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      ticket.status = 'resolved';
      ticket.resolution_comment = resolutionComment.trim();
      ticket.resolved_at = new Date().toISOString();
      await logActivity(id, userId, 'resolved', `Ticket resolved: ${resolutionComment}`);
      return res.json({ success: true, message: 'Ticket resolved successfully' });
    }

    await pool.query("UPDATE tickets SET status = 'resolved', resolution_comment = ?, resolved_at = NOW(), updated_at = NOW() WHERE id = ?", [resolutionComment.trim(), id]);
    await logActivity(id, userId, 'resolved', `Ticket resolved: ${resolutionComment}`);
    res.json({ success: true, message: 'Ticket resolved successfully' });
  } catch (err) {
    next(err);
  }
};

exports.reopenTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      ticket.status = ticket.assigned_to ? 'in_progress' : 'open';
      ticket.resolved_at = null;
      await logActivity(id, userId, 'reopened', 'Ticket reopened');
      return res.json({ success: true, message: 'Ticket reopened', status: ticket.status });
    }

    await pool.query("UPDATE tickets SET status = 'in_progress', resolved_at = NULL, updated_at = NOW() WHERE id = ?", [id]);
    await logActivity(id, userId, 'reopened', 'Ticket reopened');
    res.json({ success: true, message: 'Ticket reopened', status: 'in_progress' });
  } catch (err) {
    next(err);
  }
};

exports.escalateTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { id: userId, name } = req.user;

    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Escalation reason is required' });

    if (isMock()) {
      const ticket = mockDb.tickets.find(t => String(t.id) === String(id));
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      ticket.escalated_at = new Date().toISOString();
      ticket.escalation_reason = reason.trim();

      mockDb.escalations.push({
        id: Date.now(),
        ticket_id: Number(id),
        escalated_by: userId,
        escalated_by_name: name || 'Staff',
        escalated_to: 20,
        reason: reason.trim(),
        status: 'open',
        created_at: new Date().toISOString()
      });

      await logActivity(id, userId, 'escalated', `Escalated: ${reason}`);
      return res.json({ success: true, message: 'Ticket escalated to manager' });
    }

    await pool.query('UPDATE tickets SET escalated_at = NOW(), escalation_reason = ? WHERE id = ?', [reason.trim(), id]);
    await logActivity(id, userId, 'escalated', `Escalated: ${reason}`);
    res.json({ success: true, message: 'Ticket escalated to manager' });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    if (isMock()) return res.json({ success: true, categories: mockDb.categories });
    const [cats] = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: cats });
  } catch (err) {
    next(err);
  }
};
