// API utility for frontend-backend integration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const url = `${API_URL}${endpoint}`;
      console.log('[API] Request', url, options.method || 'GET');

      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
      });

      const contentType = response.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text;
      }

      if (!response.ok) {
        const errorMessage = typeof data === 'string'
          ? `${data}`
          : data.error || `HTTP Error: ${response.status}`;
        throw new Error(errorMessage);
      }

      return { success: true, data };
    } catch (error) {
      console.error('[API] Request failed:', error);
      const message = error.message === 'Failed to fetch'
        ? `Failed to fetch. Check if the backend is running and reachable at ${API_URL}`
        : error.message;
      return { success: false, error: message };
    }
  }

  // Auth endpoints
  login(email, password, role) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  // Student endpoints
  getStudents(dept, year) {
    const params = new URLSearchParams();
    if (dept) params.append('dept', dept);
    if (year) params.append('year', year);
    return this.request(`/students?${params.toString()}`);
  }

  createStudent(studentData) {
    return this.request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  updateStudent(id, studentData) {
    return this.request(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  deleteStudent(id) {
    return this.request(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  getDashboard() {
    return this.request('/dashboard');
  }

  // Attendance endpoints
  saveAttendance(attendanceData) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  getAttendance(startDate, endDate, department) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (department) params.append('department', department);
    return this.request(`/attendance?${params.toString()}`);
  }

  // Alerts endpoints
  sendAlert(to, message) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    });
  }
}

export const apiClient = new APIClient();
