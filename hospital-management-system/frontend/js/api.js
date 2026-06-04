/* ============================================================
   API - Centralized fetch wrapper
   ============================================================ */

const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') || window.location.origin.includes('5500')
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;


function getCorrectUrl(path) {
  const prefix = window.location.pathname.startsWith('/frontend') ? '/frontend' : '';
  if (prefix && !path.startsWith(prefix)) {
    return prefix + path;
  }
  return path;
}

// Automatically adapt all hardcoded links on load if running under Live Server
document.addEventListener('DOMContentLoaded', () => {
  const prefix = window.location.pathname.startsWith('/frontend') ? '/frontend' : '';
  if (prefix) {
    document.querySelectorAll('a[href^="/pages/"]').forEach(a => {
      const currentHref = a.getAttribute('href');
      if (!currentHref.startsWith(prefix)) {
        a.setAttribute('href', prefix + currentHref);
      }
    });
  }
});

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function isLoggedIn() { return !!getToken(); }
function isAdmin() { const u = getUser(); return u && u.role === 'admin'; }
function isPatient() { const u = getUser(); return u && u.role === 'patient'; }

async function apiRequest(endpoint, method = 'GET', body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    // If token expired / unauthorized, clear auth
    if (res.status === 401) {
      clearAuth();
      window.location.href = getCorrectUrl('/pages/login.html');
      return;
    }

    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    console.error('API error:', err);
    return { ok: false, message: 'Network error. Please check if the server is running.' };
  }
}

// Shorthand API methods
const api = {
  get: (url, auth = false) => apiRequest(url, 'GET', null, auth),
  post: (url, body, auth = false) => apiRequest(url, 'POST', body, auth),
  put: (url, body, auth = false) => apiRequest(url, 'PUT', body, auth),
  delete: (url, auth = false) => apiRequest(url, 'DELETE', null, auth),
};

