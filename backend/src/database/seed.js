require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const subDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};
const addHours = (date, h) => {
  const d = new Date(date);
  d.setHours(d.getHours() + h);
  return d;
};

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Starting seed...');

    // Drop and recreate via schema
    const fs = require('fs');
    const path = require('path');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Execute each statement separately
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('✅ Schema applied');

    // Clear data in correct FK order
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE escalations');
    await conn.query('TRUNCATE TABLE notifications');
    await conn.query('TRUNCATE TABLE ticket_activity');
    await conn.query('TRUNCATE TABLE ticket_messages');
    await conn.query('TRUNCATE TABLE tickets');
    await conn.query('TRUNCATE TABLE categories');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('TRUNCATE TABLE departments');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── Passwords ─────────────────────────────────────
    const managerPass = await bcrypt.hash('Manager@123', 10);
    const staffPass = await bcrypt.hash('Staff@123', 10);
    const studentPass = await bcrypt.hash('Student@123', 10);

    // ── Departments ───────────────────────────────────
    const [depResult] = await conn.query(
      `INSERT INTO departments (name, description) VALUES
       ('Academic Affairs', 'Handles all academic matters'),
       ('Finance & Accounts', 'Fee payments, scholarships and refunds'),
       ('Administration', 'ID cards, certificates and general admin')`
    );
    const deptIds = { academic: 1, finance: 2, admin: 3 };

    // ── Users ─────────────────────────────────────────
    // Manager
    await conn.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, is_active) VALUES
       ('Dr. Sarah Manager', 'manager@college.edu', ?, 'manager', 3, 1)`,
      [managerPass]
    );

    // Staff
    await conn.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, is_active) VALUES
       ('Alex Johnson', 'staff1@college.edu', ?, 'staff', 1, 1),
       ('Maria Rodriguez', 'staff2@college.edu', ?, 'staff', 2, 1),
       ('James Wilson', 'staff3@college.edu', ?, 'staff', 3, 1)`,
      [staffPass, staffPass, staffPass]
    );

    // Students
    await conn.query(
      `INSERT INTO users (name, email, password_hash, role, is_active) VALUES
       ('Alice Thompson', 'student1@college.edu', ?, 'student', 1),
       ('Bob Martinez', 'student2@college.edu', ?, 'student', 1),
       ('Carol Davis', 'student3@college.edu', ?, 'student', 1),
       ('David Lee', 'student4@college.edu', ?, 'student', 1),
       ('Emma Wilson', 'student5@college.edu', ?, 'student', 1)`,
      [studentPass, studentPass, studentPass, studentPass, studentPass]
    );

    console.log('✅ Users created (1 manager, 3 staff, 5 students)');

    // User IDs: manager=1, staff1=2, staff2=3, staff3=4, students=5..9

    // ── Categories ────────────────────────────────────
    await conn.query(
      `INSERT INTO categories (name, description, department_id, sla_hours) VALUES
       ('Fees', 'Fee payment, receipts and refund issues', 2, 24),
       ('Attendance', 'Attendance correction and shortage', 1, 48),
       ('ID Card', 'Lost or damaged ID card replacement', 3, 48),
       ('Certificate', 'Bonafide, NOC and other certificates', 1, 8),
       ('Documents', 'Marksheets, transcripts and other documents', 1, 24),
       ('Other', 'Miscellaneous administrative issues', 3, 48)`
    );
    // Category IDs: 1=Fees, 2=Attendance, 3=ID Card, 4=Certificate, 5=Documents, 6=Other

    console.log('✅ Categories created');

    // ── Tickets ───────────────────────────────────────
    // Helper to insert a ticket
    const insertTicket = async (data) => {
      const [r] = await conn.query(
        `INSERT INTO tickets
         (ticket_number, student_id, category_id, subject, description, priority, status,
          assigned_to, created_at, updated_at, due_at, resolved_at, closed_at, escalated_at,
          escalation_reason, resolution_comment)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          data.number, data.studentId, data.categoryId, data.subject, data.description,
          data.priority, data.status, data.assignedTo || null,
          data.createdAt, data.createdAt,
          data.dueAt, data.resolvedAt || null, data.closedAt || null,
          data.escalatedAt || null, data.escalationReason || null,
          data.resolutionComment || null,
        ]
      );
      return r.insertId;
    };

    // Ticket 1: Overdue critical - student 5, staff 2
    const t1Created = subDays(3);
    const t1Id = await insertTicket({
      number: 'TKT-2024-0001', studentId: 5, categoryId: 1,
      subject: 'Semester fee not reflecting in portal',
      description: 'I paid my semester fee of ₹45,000 on 15th September via NEFT but the payment is not reflecting in the student portal. My transaction ID is TXN123456789. Please resolve urgently as fee deadline is approaching.',
      priority: 'critical', status: 'in_progress', assignedTo: 2,
      createdAt: t1Created,
      dueAt: addHours(t1Created, 4), // OVERDUE (4h SLA already passed 3 days ago)
      escalatedAt: subDays(2), escalationReason: 'SLA breach - automated escalation',
    });

    // Ticket 2: High priority - assigned, due soon
    const t2Created = subDays(1);
    const t2Id = await insertTicket({
      number: 'TKT-2024-0002', studentId: 6, categoryId: 4,
      subject: 'Bonafide certificate needed urgently for visa',
      description: 'I need a bonafide certificate urgently for my US visa interview scheduled on 26th September. Please issue it at the earliest. My enrollment number is CS2021045.',
      priority: 'high', status: 'assigned', assignedTo: 3,
      createdAt: t2Created,
      dueAt: addHours(t2Created, 8), // Overdue (8h SLA, created 1 day ago)
    });

    // Ticket 3: Resolved ticket
    const t3Created = subDays(5);
    const t3Id = await insertTicket({
      number: 'TKT-2024-0003', studentId: 7, categoryId: 3,
      subject: 'Lost ID card replacement',
      description: 'I lost my student ID card somewhere on campus on 19th September. I need a replacement ID card urgently as it is needed for exam access.',
      priority: 'medium', status: 'resolved', assignedTo: 4,
      createdAt: t3Created,
      dueAt: addHours(t3Created, 48),
      resolvedAt: subDays(2),
      resolutionComment: 'Replacement ID card has been prepared. Please collect from Administration office (Room 101) with your enrollment number and a passport photo.',
    });

    // Ticket 4: Open, unassigned
    const t4Created = subDays(0.5);
    const t4Id = await insertTicket({
      number: 'TKT-2024-0004', studentId: 8, categoryId: 2,
      subject: 'Attendance shortage in Mathematics',
      description: 'My attendance in Mathematics (MA301) is showing 67% but I have attended all classes. I have medical leave for 3 days (23-25 Aug) that was approved but not updated. Attached are the medical certificates.',
      priority: 'medium', status: 'open', assignedTo: null,
      createdAt: t4Created,
      dueAt: addHours(t4Created, 48),
    });

    // Ticket 5: In Progress, pending student info
    const t5Created = subDays(2);
    const t5Id = await insertTicket({
      number: 'TKT-2024-0005', studentId: 9, categoryId: 5,
      subject: 'Marksheet discrepancy - Grade not updated',
      description: 'My marksheet for 4th semester shows D grade in Operating Systems (CS401) but I scored 78/100 in the final exam. The result was published on 10th September and shows incorrect marks.',
      priority: 'high', status: 'pending', assignedTo: 2,
      createdAt: t5Created,
      dueAt: addHours(t5Created, 24),
    });

    // Ticket 6: Closed
    const t6Created = subDays(10);
    const t6Id = await insertTicket({
      number: 'TKT-2024-0006', studentId: 5, categoryId: 6,
      subject: 'Campus library membership renewal',
      description: 'My campus library membership expired on 1st September. I need it renewed for the current semester. Please let me know the procedure and any fees involved.',
      priority: 'low', status: 'closed', assignedTo: 4,
      createdAt: t6Created,
      dueAt: addHours(t6Created, 48),
      resolvedAt: subDays(8),
      closedAt: subDays(7),
      resolutionComment: 'Library membership has been renewed for the current semester (Sept 2024 - Jan 2025). Your membership card is valid. No additional fees required.',
    });

    // Ticket 7: Open (student 6, no assignment yet)
    const t7Created = subDays(0.2);
    const t7Id = await insertTicket({
      number: 'TKT-2024-0007', studentId: 6, categoryId: 1,
      subject: 'Scholarship amount not credited',
      description: 'My merit scholarship of ₹20,000 was supposed to be credited in the first week of September but I have not received it yet. My scholarship ID is SCH2024-445.',
      priority: 'high', status: 'open', assignedTo: null,
      createdAt: t7Created,
      dueAt: addHours(t7Created, 8),
    });

    // Ticket 8: Assigned (student 7)
    const t8Created = subDays(1.5);
    const t8Id = await insertTicket({
      number: 'TKT-2024-0008', studentId: 7, categoryId: 4,
      subject: 'NOC letter required for internship',
      description: 'I have been selected for a 6-month internship at TechCorp India. I need a No Objection Certificate from the college to join. The internship starts on 1st October.',
      priority: 'medium', status: 'in_progress', assignedTo: 3,
      createdAt: t8Created,
      dueAt: addHours(t8Created, 8),
    });

    // Ticket 9: Resolved (student 8)
    const t9Created = subDays(7);
    const t9Id = await insertTicket({
      number: 'TKT-2024-0009', studentId: 8, categoryId: 1,
      subject: 'Late fee waiver request',
      description: 'Due to a family emergency, I was unable to pay my semester fee on time. I request a waiver of the late fee penalty of ₹1,500. I have supporting documents available.',
      priority: 'medium', status: 'resolved', assignedTo: 2,
      createdAt: t9Created,
      dueAt: addHours(t9Created, 24),
      resolvedAt: subDays(5),
      resolutionComment: 'Late fee waiver approved considering your circumstances. Your account has been updated to remove the penalty. Please ensure timely payment going forward.',
    });

    // Ticket 10: In progress (student 9)
    const t10Created = subDays(3);
    const t10Id = await insertTicket({
      number: 'TKT-2024-0010', studentId: 9, categoryId: 2,
      subject: 'Wrong attendance entries in portal',
      description: 'Multiple attendance entries are incorrect in the student portal for the month of August 2024. I was present for all sessions but the portal shows absences on Aug 12, 15, 19, and 22.',
      priority: 'low', status: 'in_progress', assignedTo: 4,
      createdAt: t10Created,
      dueAt: addHours(t10Created, 48),
    });

    console.log('✅ 10 tickets created');

    // ── Ticket Messages ───────────────────────────────
    const insertMsg = async (ticketId, senderId, type, content, createdAt) => {
      await conn.query(
        'INSERT INTO ticket_messages (ticket_id, sender_id, message_type, content, created_at) VALUES (?,?,?,?,?)',
        [ticketId, senderId, type, content, createdAt]
      );
    };

    // T1 conversation
    await insertMsg(t1Id, 5, 'reply', 'I have attached the bank transaction receipt. Transaction ID: TXN123456789 dated 15-Sep-2024.', addHours(t1Created, 0.5));
    await insertMsg(t1Id, 2, 'reply', 'Thank you for the details. I am checking with the finance team about the payment status. Will update you shortly.', addHours(t1Created, 2));
    await insertMsg(t1Id, 2, 'internal_note', 'Checked with finance dept - payment received but system update pending due to batch processing delay. Should reflect by EOD.', addHours(t1Created, 3));
    await insertMsg(t1Id, 5, 'reply', 'It has been 3 days and still not updated. This is causing problems as my exams are approaching.', subDays(1));

    // T2 conversation
    await insertMsg(t2Id, 6, 'reply', 'My visa interview is on 26th September at 9 AM. I urgently need the certificate before that.', addHours(t2Created, 0.25));
    await insertMsg(t2Id, 3, 'reply', 'Noted. I have escalated this to the academic section. The certificate will be ready within 4 hours.', addHours(t2Created, 1));
    await insertMsg(t2Id, 3, 'internal_note', 'Student has a real visa interview. Prioritize this - speak to registrar directly.', addHours(t2Created, 1.1));

    // T3 conversation (resolved)
    await insertMsg(t3Id, 7, 'reply', 'I have filed a complaint with security also. Please process the replacement as soon as possible.', addHours(t3Created, 1));
    await insertMsg(t3Id, 4, 'reply', 'We have verified your identity. Your replacement ID card is being prepared and will be ready by tomorrow.', addHours(t3Created, 8));
    await insertMsg(t3Id, 7, 'reply', 'Thank you! I will come and collect it tomorrow morning.', addHours(t3Created, 9));

    // T5 conversation (pending)
    await insertMsg(t5Id, 9, 'reply', 'Attaching my answer sheet photocopy and the original result sheet showing 78 marks.', addHours(t5Created, 0.5));
    await insertMsg(t5Id, 2, 'reply', 'I have received your documents. I need the exact question paper code and exam roll number to verify with the examination cell.', addHours(t5Created, 5));
    await insertMsg(t5Id, 2, 'internal_note', 'Need to contact exam cell. This seems like a genuine data entry error. Will follow up tomorrow.', addHours(t5Created, 5.1));
    await insertMsg(t5Id, 9, 'reply', 'My exam roll number is 21CS0045 and the paper code is CS401-NOV23.', addHours(t5Created, 6));

    // T8 conversation
    await insertMsg(t8Id, 7, 'reply', 'I have the internship offer letter from TechCorp. Do I need to submit any other documents?', addHours(t8Created, 0.3));
    await insertMsg(t8Id, 3, 'reply', 'Please submit: 1) Offer letter 2) Department HOD approval 3) Fee clearance certificate. Once received we will process the NOC within 2 working days.', addHours(t8Created, 2));

    console.log('✅ Ticket messages created');

    // ── Activity History ──────────────────────────────
    const insertActivity = async (ticketId, userId, action, desc, oldVal, newVal, createdAt) => {
      await conn.query(
        `INSERT INTO ticket_activity (ticket_id, user_id, action, old_value, new_value, description, created_at)
         VALUES (?,?,?,?,?,?,?)`,
        [ticketId, userId, action, oldVal || null, newVal || null, desc, createdAt]
      );
    };

    // T1 activities
    await insertActivity(t1Id, 5, 'created', 'Ticket TKT-2024-0001 created', null, null, t1Created);
    await insertActivity(t1Id, 1, 'assigned', 'Ticket assigned to Alex Johnson', null, '2', addHours(t1Created, 0.25));
    await insertActivity(t1Id, 2, 'status_changed', 'Status changed from assigned to in_progress', 'assigned', 'in_progress', addHours(t1Created, 2));
    await insertActivity(t1Id, 2, 'sla_breached', 'SLA breached - ticket auto-escalated to manager', null, null, addHours(t1Created, 4.1));
    await insertActivity(t1Id, 2, 'escalated', 'Ticket escalated to manager due to SLA breach', null, null, subDays(2));

    // T2 activities
    await insertActivity(t2Id, 6, 'created', 'Ticket TKT-2024-0002 created', null, null, t2Created);
    await insertActivity(t2Id, 1, 'assigned', 'Ticket assigned to Maria Rodriguez', null, '3', addHours(t2Created, 0.5));

    // T3 activities
    await insertActivity(t3Id, 7, 'created', 'Ticket TKT-2024-0003 created', null, null, t3Created);
    await insertActivity(t3Id, 1, 'assigned', 'Ticket assigned to James Wilson', null, '4', addHours(t3Created, 1));
    await insertActivity(t3Id, 4, 'status_changed', 'Status changed to in_progress', 'assigned', 'in_progress', addHours(t3Created, 2));
    await insertActivity(t3Id, 4, 'resolved', 'Ticket resolved with replacement card prepared', 'in_progress', 'resolved', subDays(2));

    // T4 activities
    await insertActivity(t4Id, 8, 'created', 'Ticket TKT-2024-0004 created', null, null, t4Created);

    // T5 activities
    await insertActivity(t5Id, 9, 'created', 'Ticket TKT-2024-0005 created', null, null, t5Created);
    await insertActivity(t5Id, 1, 'assigned', 'Ticket assigned to Alex Johnson', null, '2', addHours(t5Created, 1));
    await insertActivity(t5Id, 2, 'status_changed', 'Status changed to pending', 'in_progress', 'pending', addHours(t5Created, 5));

    // T6 activities
    await insertActivity(t6Id, 5, 'created', 'Ticket TKT-2024-0006 created', null, null, t6Created);
    await insertActivity(t6Id, 1, 'assigned', 'Ticket assigned to James Wilson', null, '4', addHours(t6Created, 2));
    await insertActivity(t6Id, 4, 'resolved', 'Library membership renewed', 'in_progress', 'resolved', subDays(8));
    await insertActivity(t6Id, 1, 'status_changed', 'Ticket closed', 'resolved', 'closed', subDays(7));

    // T8 activities
    await insertActivity(t8Id, 7, 'created', 'Ticket TKT-2024-0008 created', null, null, t8Created);
    await insertActivity(t8Id, 1, 'assigned', 'Ticket assigned to Maria Rodriguez', null, '3', addHours(t8Created, 0.5));
    await insertActivity(t8Id, 3, 'status_changed', 'Status changed to in_progress', 'assigned', 'in_progress', addHours(t8Created, 1));

    // T9 activities
    await insertActivity(t9Id, 8, 'created', 'Ticket TKT-2024-0009 created', null, null, t9Created);
    await insertActivity(t9Id, 1, 'assigned', 'Ticket assigned to Alex Johnson', null, '2', addHours(t9Created, 1));
    await insertActivity(t9Id, 2, 'resolved', 'Late fee waiver approved', 'in_progress', 'resolved', subDays(5));

    // T10 activities
    await insertActivity(t10Id, 9, 'created', 'Ticket TKT-2024-0010 created', null, null, t10Created);
    await insertActivity(t10Id, 1, 'assigned', 'Ticket assigned to James Wilson', null, '4', addHours(t10Created, 1));

    console.log('✅ Activity history created');

    // ── Escalations ───────────────────────────────────
    await conn.query(
      `INSERT INTO escalations (ticket_id, escalated_by, escalated_to, reason, status, created_at)
       VALUES (?, 2, 1, 'SLA breach - automated escalation after 4-hour critical deadline', 'open', ?)`,
      [t1Id, subDays(2)]
    );

    console.log('✅ Escalation created');

    // ── Notifications ─────────────────────────────────
    const insertNotif = async (userId, ticketId, title, message, type, isRead, createdAt) => {
      await conn.query(
        `INSERT INTO notifications (user_id, ticket_id, title, message, type, is_read, created_at)
         VALUES (?,?,?,?,?,?,?)`,
        [userId, ticketId, title, message, type, isRead, createdAt]
      );
    };

    // Student notifications
    await insertNotif(5, t1Id, 'Ticket Created', 'Your ticket TKT-2024-0001 has been submitted successfully.', 'ticket_created', true, t1Created);
    await insertNotif(5, t1Id, 'Staff Replied', 'A staff member replied on ticket TKT-2024-0001.', 'staff_reply', true, addHours(t1Created, 2));
    await insertNotif(5, t6Id, 'Ticket Resolved', 'Your ticket TKT-2024-0006 has been resolved.', 'resolved', true, subDays(8));
    await insertNotif(6, t2Id, 'Ticket Created', 'Your ticket TKT-2024-0002 has been submitted.', 'ticket_created', true, t2Created);
    await insertNotif(6, t2Id, 'Staff Replied', 'Staff replied on TKT-2024-0002.', 'staff_reply', false, addHours(t2Created, 1));
    await insertNotif(7, t3Id, 'Ticket Resolved', 'Your ticket TKT-2024-0003 has been resolved. Please collect your ID card.', 'resolved', false, subDays(2));
    await insertNotif(8, t4Id, 'Ticket Created', 'Your ticket TKT-2024-0004 has been submitted.', 'ticket_created', false, t4Created);
    await insertNotif(9, t5Id, 'Ticket Created', 'Your ticket TKT-2024-0005 has been submitted.', 'ticket_created', true, t5Created);
    await insertNotif(9, t5Id, 'Staff Replied', 'Staff requested additional information on TKT-2024-0005.', 'staff_reply', false, addHours(t5Created, 5));

    // Staff notifications
    await insertNotif(2, t1Id, 'New Ticket Assigned', 'Ticket TKT-2024-0001 has been assigned to you.', 'assignment', true, addHours(t1Created, 0.25));
    await insertNotif(2, t1Id, 'SLA Breach Warning', 'Ticket TKT-2024-0001 has breached SLA.', 'sla_breach', false, addHours(t1Created, 4.1));
    await insertNotif(2, t5Id, 'New Ticket Assigned', 'Ticket TKT-2024-0005 has been assigned to you.', 'assignment', true, addHours(t5Created, 1));
    await insertNotif(3, t2Id, 'New Ticket Assigned', 'Ticket TKT-2024-0002 has been assigned to you.', 'assignment', true, addHours(t2Created, 0.5));
    await insertNotif(3, t8Id, 'New Ticket Assigned', 'Ticket TKT-2024-0008 has been assigned to you.', 'assignment', true, addHours(t8Created, 0.5));
    await insertNotif(4, t3Id, 'New Ticket Assigned', 'Ticket TKT-2024-0003 has been assigned to you.', 'assignment', true, addHours(t3Created, 1));
    await insertNotif(4, t10Id, 'New Ticket Assigned', 'Ticket TKT-2024-0010 has been assigned to you.', 'assignment', false, addHours(t10Created, 1));

    // Manager notifications
    await insertNotif(1, t1Id, 'Escalation Alert', 'Ticket TKT-2024-0001 has been escalated due to SLA breach.', 'escalation', false, subDays(2));
    await insertNotif(1, t1Id, 'SLA Breach', 'Critical ticket TKT-2024-0001 breached SLA.', 'sla_breach', false, addHours(t1Created, 4.1));

    console.log('✅ Notifications created');
    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('   Manager : manager@college.edu  / Manager@123');
    console.log('   Staff 1 : staff1@college.edu   / Staff@123');
    console.log('   Staff 2 : staff2@college.edu   / Staff@123');
    console.log('   Staff 3 : staff3@college.edu   / Staff@123');
    console.log('   Student1: student1@college.edu / Student@123');
    console.log('   Student2: student2@college.edu / Student@123');
    console.log('   Student3: student3@college.edu / Student@123');
    console.log('   Student4: student4@college.edu / Student@123');
    console.log('   Student5: student5@college.edu / Student@123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

seed();
