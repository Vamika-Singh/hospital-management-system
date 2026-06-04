/* ============================================================
   TOAST NOTIFICATION SYSTEM
   ============================================================ */

function showToast(type, title, message, duration = 4000) {
  const container = document.getElementById('toast-container') || createToastContainer();

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  document.body.appendChild(div);
  return div;
}

/* ============================================================
   NAVBAR HELPERS
   ============================================================ */

function renderNavbar() {
  const user = getUser();
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const isLoggedInUser = !!user;
  const userIsAdmin = user && user.role === 'admin';
  const userIsPatient = user && user.role === 'patient';

  navbar.innerHTML = `
    <div class="container">
      <a href="${getCorrectUrl('/pages/index.html')}" class="nav-brand">
        <div class="brand-icon"><svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#1a56db"/><path d="M20 10v20M10 20h20" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="20" r="14" stroke="#60a5fa" stroke-width="1.5" opacity=".4"/></svg></div>
        MediCare
      </a>
      <button class="hamburger" id="hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
      <ul class="nav-links" id="nav-links">
        <li><a href="${getCorrectUrl('/pages/index.html')}">Home</a></li>
        <li><a href="${getCorrectUrl('/pages/doctors.html')}">Doctors</a></li>
        ${userIsPatient ? `<li><a href="${getCorrectUrl('/pages/patient-dashboard.html')}">My Appointments</a></li>` : ''}
        ${userIsAdmin ? `<li><a href="${getCorrectUrl('/pages/admin/dashboard.html')}">Admin Panel</a></li>` : ''}
      </ul>
      <div class="nav-actions" id="nav-actions">
        ${isLoggedInUser ? `
          <div class="nav-user" id="user-menu-trigger">
            <div class="nav-user-avatar">${user.name.charAt(0).toUpperCase()}</div>
            <span class="nav-user-name">${user.name.split(' ')[0]}</span>
            <span>▾</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
        ` : `
          <a href="${getCorrectUrl('/pages/login.html')}" class="btn btn-secondary btn-sm">Login</a>
          <a href="${getCorrectUrl('/pages/register.html')}" class="btn btn-primary btn-sm">Register</a>
        `}
      </div>
    </div>
  `;

  // Hamburger toggle
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
    document.getElementById('nav-actions')?.classList.toggle('open');
  });

  // Highlight active link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    if (link.href === window.location.href) link.classList.add('active');
  });
}

function logout() {
  clearAuth();
  showToast('info', 'Logged out', 'You have been logged out successfully.');
  setTimeout(() => window.location.href = getCorrectUrl('/pages/index.html'), 800);
}

/* ============================================================
   REDIRECT GUARDS
   ============================================================ */

function requireLogin(redirectTo = '/pages/login.html') {
  if (!isLoggedIn()) window.location.href = getCorrectUrl(redirectTo);
}

function requireAdminLogin() {
  if (!isLoggedIn() || !isAdmin()) window.location.href = getCorrectUrl('/pages/login.html');
}

function requirePatientLogin() {
  if (!isLoggedIn() || !isPatient()) window.location.href = getCorrectUrl('/pages/login.html');
}

function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    if (isAdmin()) window.location.href = getCorrectUrl('/pages/admin/dashboard.html');
    else window.location.href = getCorrectUrl('/pages/patient-dashboard.html');
  }
}

/* ============================================================
   FORM VALIDATION HELPERS
   ============================================================ */

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function showFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.add('error');
  let err = input.nextElementSibling;
  if (!err || !err.classList.contains('form-error')) {
    err = document.createElement('span');
    err.className = 'form-error';
    input.parentNode.insertBefore(err, input.nextSibling);
  }
  err.textContent = message;
  err.style.display = 'block';
}

function clearFieldError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.classList.remove('error');
  const err = input.nextElementSibling;
  if (err && err.classList.contains('form-error')) {
    err.style.display = 'none';
  }
}

function clearAllErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
}

/* ============================================================
   DATE / TIME HELPERS
   ============================================================ */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  if (timeStr.length === 8) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  }
  return timeStr;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getMinDate() {
  return getTodayDate();
}

/* ============================================================
   ANNOUNCEMENT BANNER
   ============================================================ */

async function loadAnnouncement(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch('http://localhost:5000/api/announcement');
    const data = await res.json();
    if (data.success && data.data) {
      container.innerHTML = `
        <div class="announcement-banner">
          <span class="banner-icon">📢</span>
          <p>${data.data.message}</p>
        </div>
      `;
    }
  } catch (e) { /* Silently ignore */ }
}

/* ============================================================
   MODAL HELPERS
   ============================================================ */

function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

/* ============================================================
   SIDEBAR MOBILE TOGGLE (for dashboard pages)
   ============================================================ */

function initSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
}
