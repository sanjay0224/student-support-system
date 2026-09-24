const API_BASE = '/api';

export const getAuthToken = () => sessionStorage.getItem('token');
export const setAuthToken = (token) => sessionStorage.setItem('token', token);
export const removeAuthToken = () => sessionStorage.removeItem('token');

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred with API request');
  }

  return data;
}

export const authApi = {
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiFetch('/auth/me'),
};

export const ticketApi = {
  getTickets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/tickets${query ? `?${query}` : ''}`);
  },
  getTicketById: (id) => apiFetch(`/tickets/${id}`),
  createTicket: (ticketData) =>
    apiFetch('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),
  reply: (id, message) =>
    apiFetch(`/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  addInternalNote: (id, message) =>
    apiFetch(`/tickets/${id}/internal-note`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  assign: (id, assignedTo) =>
    apiFetch(`/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo }),
    }),
  updateStatus: (id, status) =>
    apiFetch(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  updatePriority: (id, priority) =>
    apiFetch(`/tickets/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    }),
  resolve: (id, resolutionComment) =>
    apiFetch(`/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionComment }),
    }),
  reopen: (id, reason) =>
    apiFetch(`/tickets/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  escalate: (id, reason) =>
    apiFetch(`/tickets/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const dashboardApi = {
  getStudentDashboard: () => apiFetch('/dashboard/student'),
  getStaffDashboard: () => apiFetch('/dashboard/staff'),
  getManagerDashboard: () => apiFetch('/dashboard/manager'),
};

export const notificationApi = {
  getNotifications: () => apiFetch('/notifications'),
  markAsRead: (id) =>
    apiFetch(`/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllRead: () =>
    apiFetch('/notifications/read-all', {
      method: 'POST',
    }),
};

export const reportApi = {
  getTicketReport: () => apiFetch('/reports/tickets'),
  getCategoryReport: () => apiFetch('/reports/categories'),
  getStaffWorkload: () => apiFetch('/reports/workload'),
  getSLAReport: () => apiFetch('/reports/sla'),
};

export const userApi = {
  getStaffList: () => apiFetch('/users/staff'),
};
