export const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📧 Email Notifications | Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f0f1a;
      --card-bg: #1a1a2e;
      --border: #2a2a40;
      --text: #e5e7eb;
      --text-muted: #9ca3af;
      --primary: #667eea;
      --primary-hover: #7b90f5;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    body { background: var(--bg); color: var(--text); overflow-x: hidden; }
    a { text-decoration: none; color: var(--primary); }
    button { cursor: pointer; border: none; outline: none; transition: 0.2s; }
    
    /* Layout */
    .app-container { display: flex; height: 100vh; overflow: hidden; }
    
    /* Sidebar */
    .sidebar { width: 250px; background: var(--card-bg); border-right: 1px solid var(--border); display: none; flex-direction: column; }
    .sidebar.active { display: flex; }
    .sidebar-header { padding: 24px; font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-items { flex: 1; padding: 12px; }
    .nav-item { display: block; padding: 12px 16px; color: var(--text-muted); border-radius: 8px; margin-bottom: 4px; font-weight: 500; cursor: pointer; }
    .nav-item:hover, .nav-item.active { background: rgba(102, 126, 234, 0.1); color: var(--primary); }
    .sidebar-footer { padding: 24px; border-top: 1px solid var(--border); }
    .logout-btn { color: var(--danger); font-size: 14px; font-weight: 500; background: none; width: 100%; text-align: left; }
    
    /* Main Content */
    .main-content { flex: 1; padding: 40px; overflow-y: auto; display: none; }
    .main-content.active { display: block; }
    
    /* Auth Layout */
    .auth-container { display: flex; align-items: center; justify-content: center; height: 100vh; width: 100%; }
    .auth-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 40px; width: 100%; max-width: 400px; }
    .auth-header { text-align: center; margin-bottom: 30px; }
    .auth-header h1 { font-size: 24px; margin-bottom: 8px; }
    
    /* Components */
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 18px; font-weight: 600; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    
    .field { margin-bottom: 20px; }
    label { display: block; color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
    input, textarea { width: 100%; background: #12121f; border: 1px solid var(--border); border-radius: 8px; padding: 12px; color: var(--text); font-size: 14px; outline: none; }
    input:focus, textarea:focus { border-color: var(--primary); }
    textarea { min-height: 120px; resize: vertical; }
    
    .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; background: var(--primary); color: white; }
    .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .btn-outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }
    .btn-outline:hover { background: rgba(102, 126, 234, 0.1); }
    .btn-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
    
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
    .stat-title { color: var(--text-muted); font-size: 13px; font-weight: 500; text-transform: uppercase; margin-bottom: 12px; }
    .stat-value { font-size: 32px; font-weight: 700; }
    
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; }
    td { font-size: 14px; }
    
    .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge.success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .badge.danger { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .badge.warning { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .badge.primary { background: rgba(102, 126, 234, 0.1); color: var(--primary); }
    
    #toast { visibility: hidden; min-width: 250px; background-color: var(--card-bg); border: 1px solid var(--primary); color: #fff; text-align: center; border-radius: 8px; padding: 16px; position: fixed; z-index: 1; left: 50%; bottom: 30px; transform: translateX(-50%); font-size: 14px; }
    #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
    #toast.error { border-color: var(--danger); }
    @keyframes fadein { from { bottom: 0; opacity: 0; } to { bottom: 30px; opacity: 1; } }
    @keyframes fadeout { from { bottom: 30px; opacity: 1; } to { bottom: 0; opacity: 0; } }

    .flex { display: flex; gap: 10px; }
    .mt-4 { margin-top: 16px; }
    .text-center { text-align: center; }
  </style>
</head>
<body>

  <!-- Toast Notification -->
  <div id="toast">Message here</div>

  <!-- Auth View -->
  <div id="authView" class="auth-container">
    <!-- Login Form -->
    <div id="loginForm" class="auth-card">
      <div class="auth-header">
        <h1>Welcome Back</h1>
        <p style="color: var(--text-muted); font-size: 14px;">Sign in to your dashboard</p>
      </div>
      <form onsubmit="handleLogin(event)">
        <div class="field">
          <label>Email</label>
          <input type="email" id="loginEmail" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="loginPassword" required>
        </div>
        <button type="submit" class="btn" style="width: 100%;">Sign In</button>
      </form>
      <div class="text-center mt-4">
        <a href="#" onclick="toggleAuth('register')" style="font-size: 14px;">Need an account? Register</a>
      </div>
    </div>

    <!-- Register Form -->
    <div id="registerForm" class="auth-card" style="display: none;">
      <div class="auth-header">
        <h1>Create Account</h1>
        <p style="color: var(--text-muted); font-size: 14px;">Start sending emails</p>
      </div>
      <form onsubmit="handleRegister(event)">
        <div class="field">
          <label>Name</label>
          <input type="text" id="registerName" required>
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="registerEmail" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="registerPassword" required minlength="6">
        </div>
        <button type="submit" class="btn" style="width: 100%;">Register</button>
      </form>
      <div class="text-center mt-4">
        <a href="#" onclick="toggleAuth('login')" style="font-size: 14px;">Already have an account? Sign in</a>
      </div>
    </div>
  </div>

  <!-- Main App Layout -->
  <div id="appView" class="app-container" style="display: none;">
    <!-- Sidebar -->
    <div class="sidebar active">
      <div class="sidebar-header">📧 Email API</div>
      <div class="nav-items">
        <div class="nav-item active" onclick="switchTab('overview')">Overview</div>
        <div class="nav-item" onclick="switchTab('apikeys')">API Keys</div>
        <div class="nav-item" onclick="switchTab('smtp')">SMTP Settings</div>
        <div class="nav-item" onclick="switchTab('logs')">Email Logs</div>
        <div class="nav-item" onclick="switchTab('compose')">Test Send</div>
      </div>
      <div class="sidebar-footer">
        <button class="logout-btn" onclick="logout()">Logout</button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content active" id="overview">
      <h2 style="font-size: 24px; margin-bottom: 24px;">Dashboard Overview</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-title">Total Emails</div>
          <div class="stat-value" id="stat-total">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Sent</div>
          <div class="stat-value" style="color: var(--success);" id="stat-sent">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Failed</div>
          <div class="stat-value" style="color: var(--danger);" id="stat-failed">0</div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-title">SMTP Health</div>
        <div id="smtp-health-badge" class="badge warning" style="display: inline-block; padding: 8px 12px; font-size: 13px;">Not Configured (Using Rate-Limited Fallback)</div>
        <p style="margin-top: 12px; color: var(--text-muted); font-size: 14px;">If you exceed 100 emails/day, you must configure your own SMTP credentials in Settings.</p>
      </div>
    </div>

    <!-- API Keys -->
    <div class="main-content" id="apikeys">
      <h2 style="font-size: 24px; margin-bottom: 24px;">API Keys</h2>
      <div class="card">
        <div class="card-title">
          Your API Keys
          <button class="btn btn-outline" onclick="generateApiKey()">+ Generate New Key</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="api-keys-tbody">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- SMTP Settings -->
    <div class="main-content" id="smtp">
      <h2 style="font-size: 24px; margin-bottom: 24px;">SMTP Settings</h2>
      <div class="card">
        <div class="card-title">Custom SMTP Credentials</div>
        <form onsubmit="saveSmtp(event)">
          <div class="stat-grid" style="margin-bottom: 0;">
            <div class="field">
              <label>SMTP Host</label>
              <input type="text" id="smtpHost" placeholder="smtp.gmail.com" required>
            </div>
            <div class="field">
              <label>SMTP Port</label>
              <input type="number" id="smtpPort" placeholder="587" required>
            </div>
          </div>
          <div class="stat-grid" style="margin-bottom: 0;">
            <div class="field">
              <label>SMTP Username</label>
              <input type="text" id="smtpUser" required>
            </div>
            <div class="field">
              <label>SMTP Password / App Password</label>
              <input type="password" id="smtpPass" required>
              <small style="color: var(--text-muted); font-size: 11px; display: block; margin-top: 4px;">Passwords are encrypted at rest.</small>
            </div>
          </div>
          <div class="field">
            <label>Default "From" Email</label>
            <input type="email" id="emailFrom" required placeholder="noreply@yourdomain.com">
          </div>
          <div class="flex">
            <button type="submit" class="btn">Save Settings</button>
            <button type="button" class="btn btn-outline" onclick="verifySmtp()">Test Connection</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Email Logs -->
    <div class="main-content" id="logs">
      <h2 style="font-size: 24px; margin-bottom: 24px;">Email Logs</h2>
      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="logs-tbody">
            <!-- Rendered via JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Compose -->
    <div class="main-content" id="compose">
      <h2 style="font-size: 24px; margin-bottom: 24px;">Test Send</h2>
      <div class="card" style="max-width: 600px;">
        <form onsubmit="sendTestEmail(event)">
          <div class="field">
            <label>Recipient Email</label>
            <input type="email" id="composeEmail" required>
          </div>
          <div class="field">
            <label>Subject</label>
            <input type="text" id="composeSubject" required>
          </div>
          <div class="field">
            <label>Body (HTML allowed)</label>
            <textarea id="composeBody" required>&lt;h1&gt;Hello!&lt;/h1&gt;&lt;p&gt;Testing the service.&lt;/p&gt;</textarea>
          </div>
          <button type="submit" class="btn">Send Email →</button>
        </form>
      </div>
    </div>
  </div>

<script>
  let token = localStorage.getItem('jwt');
  let currentApiKey = null;

  function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = isError ? 'show error' : 'show';
    setTimeout(() => { t.className = t.className.replace('show', ''); }, 3000);
  }

  async function apiFetch(path, options = {}) {
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    
    if (path.includes('/send') && currentApiKey) {
      options.headers['x-api-key'] = currentApiKey;
    }
    
    const res = await fetch(path, options);
    const data = await res.json();
    
    if (res.status === 401) {
      logout();
      showToast('Session expired', true);
      throw new Error('Unauthorized');
    }
    
    if (!res.ok) throw new Error(data.message || data.error || 'API Error');
    return data;
  }

  function toggleAuth(type) {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
  }

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      token = data.token;
      localStorage.setItem('jwt', token);
      showToast('Login successful!');
      initDashboard();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      token = data.token;
      localStorage.setItem('jwt', token);
      showToast('Registration successful!');
      initDashboard();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function logout() {
    token = null;
    localStorage.removeItem('jwt');
    document.getElementById('appView').style.display = 'none';
    document.getElementById('authView').style.display = 'flex';
  }

  function switchTab(tabId) {
    document.querySelectorAll('.main-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabId === 'overview') loadStats();
    if (tabId === 'apikeys') loadApiKeys();
    if (tabId === 'smtp') loadSmtp();
    if (tabId === 'logs') loadLogs();
  }

  async function initDashboard() {
    if (!token) return;
    document.getElementById('authView').style.display = 'none';
    document.getElementById('appView').style.display = 'flex';
    await loadApiKeys(); // Load keys first to get one for sending tests
    loadStats();
  }

  async function loadStats() {
    try {
      const data = await apiFetch('/dashboard/stats');
      document.getElementById('stat-total').textContent = data.totalEmails;
      document.getElementById('stat-sent').textContent = data.sentEmails;
      document.getElementById('stat-failed').textContent = data.failedEmails;
      
      const badge = document.getElementById('smtp-health-badge');
      if (data.smtpVerified) {
        badge.className = 'badge success';
        badge.textContent = 'Configured & Verified';
      } else if (data.smtpConfigured) {
        badge.className = 'badge primary';
        badge.textContent = 'Configured (Unverified)';
      } else {
        badge.className = 'badge warning';
        badge.textContent = 'Not Configured (Using Fallback)';
      }
    } catch (err) { console.error(err); }
  }

  async function loadApiKeys() {
    try {
      const data = await apiFetch('/dashboard/api-keys');
      const tbody = document.getElementById('api-keys-tbody');
      tbody.innerHTML = '';
      
      if (data.keys.length > 0) currentApiKey = data.keys[0].fullKey;
      
      data.keys.forEach(k => {
        tbody.innerHTML += '<tr>' +
            '<td>' + k.keyName + '</td>' +
            '<td style="font-family: monospace;">' + k.apiKey + '</td>' +
            '<td>' + new Date(k.createdAt).toLocaleDateString() + '</td>' +
            '<td><button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="revokeKey(\\'' + k.id + '\\')">Revoke</button></td>' +
          '</tr>';
      });
    } catch (err) { showToast(err.message, true); }
  }

  async function generateApiKey() {
    try {
      const data = await apiFetch('/dashboard/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      showToast(data.message);
      loadApiKeys();
      // Only show full key alert once
      setTimeout(() => alert('Your new API key is: \\n\\n' + data.apiKey + '\\n\\nPlease copy it now. It will not be shown in full again.'), 500);
    } catch (err) { showToast(err.message, true); }
  }

  async function revokeKey(id) {
    if (!confirm('Are you sure you want to revoke this key?')) return;
    try {
      await apiFetch('/dashboard/api-keys/' + id, { method: 'DELETE' });
      showToast('Key revoked');
      loadApiKeys();
    } catch (err) { showToast(err.message, true); }
  }

  async function loadSmtp() {
    try {
      const data = await apiFetch('/dashboard/smtp');
      if (data.configured) {
        document.getElementById('smtpHost').value = data.smtp.smtpHost;
        document.getElementById('smtpPort').value = data.smtp.smtpPort;
        document.getElementById('smtpUser').value = data.smtp.smtpUser;
        document.getElementById('emailFrom').value = data.smtp.emailFrom;
        // Password left intentionally blank
      }
    } catch (err) { console.error(err); }
  }

  async function saveSmtp(e) {
    e.preventDefault();
    try {
      const payload = {
        smtpHost: document.getElementById('smtpHost').value,
        smtpPort: parseInt(document.getElementById('smtpPort').value),
        smtpSecure: document.getElementById('smtpPort').value == '465',
        smtpUser: document.getElementById('smtpUser').value,
        smtpPass: document.getElementById('smtpPass').value,
        emailFrom: document.getElementById('emailFrom').value,
      };
      await apiFetch('/dashboard/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showToast('SMTP settings saved!');
      loadStats();
    } catch (err) { showToast(err.message, true); }
  }

  async function verifySmtp() {
    try {
      showToast('Testing connection...');
      const data = await apiFetch('/dashboard/smtp/verify', { method: 'POST' });
      showToast(data.message);
      loadStats();
    } catch (err) { showToast(err.message, true); }
  }

  async function loadLogs() {
    try {
      const data = await apiFetch('/dashboard/emails');
      const tbody = document.getElementById('logs-tbody');
      tbody.innerHTML = '';
      
      data.emails.forEach(e => {
        let statusClass = 'warning';
        if (e.status === 'sent') statusClass = 'success';
        if (e.status === 'failed' || e.status === 'dlq') statusClass = 'danger';
        
        tbody.innerHTML += '<tr>' +
            '<td>' + new Date(e.createdAt).toLocaleString() + '</td>' +
            '<td>' + e.email + '</td>' +
            '<td>' + (e.subject || '-') + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + e.status + '</span></td>' +
          '</tr>';
      });
    } catch (err) { showToast(err.message, true); }
  }

  async function sendTestEmail(e) {
    e.preventDefault();
    if (!currentApiKey) return showToast('Please generate an API Key first', true);
    
    try {
      const payload = {
        email: document.getElementById('composeEmail').value,
        subject: document.getElementById('composeSubject').value,
        body: document.getElementById('composeBody').value,
      };
      
      const res = await apiFetch('/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      showToast('Test email queued successfully!');
      setTimeout(loadStats, 1000); // refresh stats after sending
      document.getElementById('composeBody').value = '';
      document.getElementById('composeSubject').value = '';
      document.getElementById('composeEmail').value = '';
    } catch (err) { showToast(err.message, true); }
  }

  // Check initial login state
  if (token) initDashboard();
</script>
</body>
</html>`;
