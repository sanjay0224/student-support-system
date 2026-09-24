const bcrypt = require('bcryptjs');

// Pre-seeded password hashes
const studentPasswordHash = bcrypt.hashSync('Student@123', 10);
const staffPasswordHash = bcrypt.hashSync('Staff@123', 10);
const managerPasswordHash = bcrypt.hashSync('Manager@123', 10);
const defaultHash = bcrypt.hashSync('password123', 10);

const mockUsers = [
  { id: 1, name: 'Alex Student', email: 'student1@college.edu', role: 'student', department_id: null, password_hash: studentPasswordHash },
  { id: 2, name: 'Brian Student', email: 'student2@college.edu', role: 'student', department_id: null, password_hash: studentPasswordHash },
  { id: 3, name: 'Charlie Student', email: 'student3@college.edu', role: 'student', department_id: null, password_hash: studentPasswordHash },
  { id: 4, name: 'David Student', email: 'student4@college.edu', role: 'student', department_id: null, password_hash: studentPasswordHash },
  { id: 5, name: 'Emma Student', email: 'student5@college.edu', role: 'student', department_id: null, password_hash: studentPasswordHash },
  { id: 6, name: 'Demo Student', email: 'student@example.com', role: 'student', department_id: null, password_hash: defaultHash },
  { id: 10, name: 'Sarah Jenkins (Staff)', email: 'staff1@college.edu', role: 'staff', department_id: 1, password_hash: staffPasswordHash },
  { id: 11, name: 'Mark Wood (Staff)', email: 'staff2@college.edu', role: 'staff', department_id: 2, password_hash: staffPasswordHash },
  { id: 12, name: 'Lisa Ray (Staff)', email: 'staff3@college.edu', role: 'staff', department_id: 3, password_hash: staffPasswordHash },
  { id: 13, name: 'Demo Staff', email: 'staff@example.com', role: 'staff', department_id: 1, password_hash: defaultHash },
  { id: 20, name: 'Prof. Robert Miller', email: 'manager@college.edu', role: 'manager', department_id: 1, password_hash: managerPasswordHash },
  { id: 21, name: 'Demo Manager', email: 'manager@example.com', role: 'manager', department_id: 1, password_hash: defaultHash },
];

const mockDepartments = [
  { id: 1, name: 'Academic & Admissions', description: 'Transcripts, enrollment, and course issues' },
  { id: 2, name: 'Finance & Accounts', description: 'Tuition fees, scholarships, and refunds' },
  { id: 3, name: 'Student Affairs', description: 'ID Cards, hostel, certificates and general admin' },
];

const mockCategories = [
  { id: 1, name: 'Fees & Payment', description: 'Fee receipts, installment requests, payment gateway errors', department_id: 2, sla_hours: 24 },
  { id: 2, name: 'Attendance Record', description: 'Condonation, biometric correction, medical leave updates', department_id: 1, sla_hours: 48 },
  { id: 3, name: 'ID Card & Access', description: 'New ID issuance, RFID chip damage, temporary gate pass', department_id: 3, sla_hours: 48 },
  { id: 4, name: 'Bonafide & Certificates', description: 'Bonafide certificate, Lor, migration certificate', department_id: 3, sla_hours: 8 },
  { id: 5, name: 'Document Verification', description: 'Degree verification, marksheet correction', department_id: 1, sla_hours: 24 },
  { id: 6, name: 'Other Administrative', description: 'General queries and escalations', department_id: 3, sla_hours: 48 },
];

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const hoursAhead = (h) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

let mockTickets = [
  {
    id: 101,
    ticket_number: 'TKT-2026-0001',
    student_id: 1,
    student_name: 'Alex Student',
    student_email: 'student1@college.edu',
    category_id: 1,
    category_name: 'Fees & Payment',
    subject: 'Tuition Fee Payment Receipt Not Generated',
    description: 'I paid $2,400 via net banking yesterday, transaction ID #9928172, but the portal still shows status as Unpaid.',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 11,
    assigned_to_name: 'Mark Wood (Staff)',
    created_at: hoursAgo(10),
    updated_at: hoursAgo(2),
    due_at: hoursAhead(14),
    resolved_at: null,
    closed_at: null,
    escalated_at: null,
    escalation_reason: null,
    resolution_comment: null,
  },
  {
    id: 102,
    ticket_number: 'TKT-2026-0002',
    student_id: 2,
    student_name: 'Brian Student',
    student_email: 'student2@college.edu',
    category_id: 4,
    category_name: 'Bonafide & Certificates',
    subject: 'Urgent Request for Passport Bonafide Certificate',
    description: 'I have a passport appointment this Friday and require an official Bonafide Certificate stamped by the Dean.',
    priority: 'critical',
    status: 'assigned',
    assigned_to: 10,
    assigned_to_name: 'Sarah Jenkins (Staff)',
    created_at: hoursAgo(7),
    updated_at: hoursAgo(1),
    due_at: hoursAgo(1), // Overdue SLA!
    resolved_at: null,
    closed_at: null,
    escalated_at: hoursAgo(1),
    escalation_reason: 'SLA Breached - urgent passport appointment',
    resolution_comment: null,
  },
  {
    id: 103,
    ticket_number: 'TKT-2026-0003',
    student_id: 3,
    student_name: 'Charlie Student',
    student_email: 'student3@college.edu',
    category_id: 3,
    category_name: 'ID Card & Access',
    subject: 'Smart ID Card RFID Chip Malfunctioning',
    description: 'My smart ID card fails at the library turnstile and hostel entrance. Needs replacement chip or re-encoding.',
    priority: 'medium',
    status: 'open',
    assigned_to: null,
    assigned_to_name: null,
    created_at: hoursAgo(3),
    updated_at: hoursAgo(3),
    due_at: hoursAhead(45),
    resolved_at: null,
    closed_at: null,
    escalated_at: null,
    escalation_reason: null,
    resolution_comment: null,
  },
  {
    id: 104,
    ticket_number: 'TKT-2026-0004',
    student_id: 4,
    student_name: 'David Student',
    student_email: 'student4@college.edu',
    category_id: 2,
    category_name: 'Attendance Record',
    subject: 'Medical Leave Attendance Condonation Request',
    description: 'Submitted medical certificate for hospital admission from Sept 10-15. Requesting update to attendance sheet for CS201.',
    priority: 'medium',
    status: 'resolved',
    assigned_to: 10,
    assigned_to_name: 'Sarah Jenkins (Staff)',
    created_at: hoursAgo(30),
    updated_at: hoursAgo(4),
    due_at: hoursAgo(6),
    resolved_at: hoursAgo(4),
    closed_at: null,
    escalation_reason: null,
    resolution_comment: 'Medical certificate verified with college clinic. Attendance updated to 88%.',
  },
  {
    id: 105,
    ticket_number: 'TKT-2026-0005',
    student_id: 6,
    student_name: 'Demo Student',
    student_email: 'student@example.com',
    category_id: 5,
    category_name: 'Document Verification',
    subject: 'Grade Sheet Discrepancy in Semester 4',
    description: 'My SGPA on the digital marksheet shows 7.8, but calculated course credits yield 8.4. Please recalculate.',
    priority: 'high',
    status: 'in_progress',
    assigned_to: 12,
    assigned_to_name: 'Lisa Ray (Staff)',
    created_at: hoursAgo(5),
    updated_at: hoursAgo(1),
    due_at: hoursAhead(19),
    resolved_at: null,
    closed_at: null,
    escalated_at: null,
    escalation_reason: null,
    resolution_comment: null,
  }
];

let mockMessages = [
  {
    id: 1,
    ticket_id: 101,
    sender_id: 1,
    sender_name: 'Alex Student',
    sender_role: 'student',
    message_type: 'reply',
    content: 'Attached bank acknowledgment statement for transaction #9928172.',
    created_at: hoursAgo(9),
  },
  {
    id: 2,
    ticket_id: 101,
    sender_id: 11,
    sender_name: 'Mark Wood (Staff)',
    sender_role: 'staff',
    message_type: 'reply',
    content: 'Hello Alex, I have routed the transaction reference to our finance reconciliation team. Will update shortly.',
    created_at: hoursAgo(2),
  },
  {
    id: 3,
    ticket_id: 101,
    sender_id: 11,
    sender_name: 'Mark Wood (Staff)',
    sender_role: 'staff',
    message_type: 'internal_note',
    content: 'Internal Note: Waiting for HDFC gateway daily settlement report batch at 4 PM.',
    created_at: hoursAgo(2),
  },
  {
    id: 4,
    ticket_id: 102,
    sender_id: 10,
    sender_name: 'Sarah Jenkins (Staff)',
    sender_role: 'staff',
    message_type: 'internal_note',
    content: 'Internal Note: Registrar office seal is unavailable today due to audit. Escalated to Manager for signature bypass.',
    created_at: hoursAgo(1),
  }
];

let mockActivities = [
  { id: 1, ticket_id: 101, user_id: 1, action: 'created', description: 'Ticket created by Alex Student', created_at: hoursAgo(10) },
  { id: 2, ticket_id: 101, user_id: 11, action: 'assigned', description: 'Assigned to Mark Wood', created_at: hoursAgo(8) },
  { id: 3, ticket_id: 101, user_id: 11, action: 'status_changed', description: 'Status changed from assigned to in_progress', created_at: hoursAgo(7) },
  { id: 4, ticket_id: 102, user_id: 10, action: 'escalated', description: 'Ticket escalated due to SLA breach', created_at: hoursAgo(1) },
];

let mockNotifications = [
  { id: 1, user_id: 1, ticket_id: 101, title: 'Ticket Update', message: 'Staff member Mark Wood replied to your ticket TKT-2026-0001.', type: 'reply', is_read: false, created_at: hoursAgo(2) },
  { id: 2, user_id: 10, ticket_id: 102, title: 'SLA Alert', message: 'Ticket TKT-2026-0002 has breached SLA!', type: 'sla_breach', is_read: false, created_at: hoursAgo(1) },
  { id: 3, user_id: 20, ticket_id: 102, title: 'Escalation Notice', message: 'Ticket TKT-2026-0002 was escalated to management.', type: 'escalation', is_read: false, created_at: hoursAgo(1) },
];

let mockEscalations = [
  { id: 1, ticket_id: 102, escalated_by: 10, escalated_by_name: 'Sarah Jenkins', escalated_to: 20, reason: 'SLA Breached - urgent passport appointment requiring Dean seal', status: 'open', created_at: hoursAgo(1) }
];

module.exports = {
  users: mockUsers,
  departments: mockDepartments,
  categories: mockCategories,
  tickets: mockTickets,
  messages: mockMessages,
  activities: mockActivities,
  notifications: mockNotifications,
  escalations: mockEscalations,
};
