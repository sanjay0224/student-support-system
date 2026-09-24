# EduCare — Student Support & Ticket Management System

A production-quality full-stack product solution designed for colleges to centralize student requests (Fees, Attendance, ID Cards, Certificates, Documents, etc.) and empower support staff and management to process, assign, track, escalate, and resolve student issues with SLA enforcement.

---

## 🌟 Key Features

* 🎓 **Student Portal**: Raise support tickets, track status badges, view live category SLA countdown timers, and reply to staff.
* 👩‍💼 **Staff Console**: Claim unassigned tickets from department pools, execute workflow transitions (`Open` → `Assigned` → `In Progress` → `Pending` → `Resolved`), add private 🔒 internal staff notes, and trigger escalations.
* 👑 **Manager Analytics**: Executive SLA compliance rate %, staff workload distribution, category issue breakdown, and active escalation management.
* 🔒 **Per-Tab Multi-Session Isolation**: Built using `sessionStorage` token isolation so Staff, Student, and Manager roles can run concurrently in different browser tabs on `http://localhost:3000` without session bleeding.
* ⚡ **In-Memory & MySQL Dual Mode**: Runs automatically out-of-the-box with dynamic fallback seed data, or connects directly to MySQL.

---

## 🛠 Tech Stack

* **Frontend**: Next.js / Vite + React 18, Tailwind CSS, Lucide Icons, Fetch API
* **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs
* **Database**: MySQL 8.0 (with automatic In-Memory Fallback)

---

## 🚀 Quick Start Guide

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/student-support-system.git
cd student-support-system
```

### 2. Run the Backend API
```bash
cd backend
npm install
npm start
```
> Running on `http://localhost:5000`

### 3. Run the Frontend App
```bash
cd ../frontend
npm install
npm run dev
```
> Running on `http://localhost:3000`

---

## 🔑 Demo Login Credentials

You can use the 1-Click Demo buttons on the login screen or enter these credentials:

| Role | Email | Password |
|---|---|---|
| 🎓 **Student** | `student1@college.edu` | `Student@123` |
| 👩‍💼 **Staff** | `staff1@college.edu` | `Staff@123` |
| 👑 **Manager** | `manager@college.edu` | `Manager@123` |
