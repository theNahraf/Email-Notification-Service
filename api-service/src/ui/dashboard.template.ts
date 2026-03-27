export const dashboardHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Notifications | Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f0f1a;
      --card-bg: #1a1a2e;
      --border: #2a2a40;
      --input-bg: #12121f;
      --text: #e5e7eb;
      --text-muted: #9ca3af;
      --text-dim: #6b7280;
      --primary: #667eea;
      --primary-hover: #7b90f5;
      --primary-glow: rgba(102,126,234,0.15);
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #3b82f6;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
    body { background: var(--bg); color: var(--text); overflow-x: hidden; }
    a { text-decoration: none; color: var(--primary); }
    a:hover { text-decoration: underline; }
    button { cursor: pointer; border: none; outline: none; transition: all 0.2s; font-family: 'Inter', sans-serif; }
    code { font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; font-size: 13px; }
    pre { overflow-x: auto; }

    /* Layout */
    .app-container { display: flex; height: 100vh; overflow: hidden; }

    /* Sidebar */
    .sidebar { width: 260px; background: var(--card-bg); border-right: 1px solid var(--border); display: none; flex-direction: column; flex-shrink: 0; }
    .sidebar.active { display: flex; }
    .sidebar-header { padding: 24px; font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.3px; }
    .nav-items { flex: 1; padding: 8px 12px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 11px 16px; color: var(--text-muted); border-radius: 8px; margin-bottom: 2px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.15s; }
    .nav-item:hover { background: var(--primary-glow); color: var(--primary); }
    .nav-item.active { background: var(--primary-glow); color: var(--primary); }
    .nav-icon { font-size: 18px; width: 22px; text-align: center; }
    .sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); }
    .user-info { font-size: 12px; color: var(--text-dim); margin-bottom: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .logout-btn { color: var(--danger); font-size: 13px; font-weight: 500; background: none; width: 100%; text-align: left; padding: 8px 0; }

    /* Main Content */
    .main-content { flex: 1; padding: 40px; overflow-y: auto; display: none; }
    .main-content.active { display: block; }
    .page-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .page-desc { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; }

    /* Auth Layout */
    .auth-container { display: flex; align-items: center; justify-content: center; height: 100vh; width: 100%; }
    .auth-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .auth-header { text-align: center; margin-bottom: 30px; }
    .auth-header h1 { font-size: 24px; margin-bottom: 8px; }

    /* Components */
    .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 16px; font-weight: 600; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }

    .field { margin-bottom: 20px; }
    label { display: block; color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    input, textarea, select { width: 100%; background: var(--input-bg); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; color: var(--text); font-size: 14px; outline: none; transition: border 0.2s; font-family: 'Inter', sans-serif; }
    input:focus, textarea:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-glow); }
    textarea { min-height: 120px; resize: vertical; }

    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; background: var(--primary); color: white; display: inline-flex; align-items: center; gap: 6px; }
    .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-outline { background: transparent; border: 1px solid var(--primary); color: var(--primary); }
    .btn-outline:hover { background: var(--primary-glow); transform: translateY(-1px); }
    .btn-danger { background: rgba(239,68,68,0.1); color: var(--danger); border: 1px solid rgba(239,68,68,0.2); }
    .btn-danger:hover { background: rgba(239,68,68,0.2); }
    .btn-success { background: rgba(16,185,129,0.15); color: var(--success); border: 1px solid rgba(16,185,129,0.2); }
    .btn-ghost { background: transparent; color: var(--text-muted); padding: 6px 10px; }
    .btn-ghost:hover { color: var(--text); background: rgba(255,255,255,0.05); }

    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
    .stat-title { color: var(--text-muted); font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: 700; }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    td { font-size: 13px; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    .badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .badge-success { background: rgba(16,185,129,0.12); color: var(--success); }
    .badge-danger { background: rgba(239,68,68,0.12); color: var(--danger); }
    .badge-warning { background: rgba(245,158,11,0.12); color: var(--warning); }
    .badge-primary { background: rgba(102,126,234,0.12); color: var(--primary); }
    .badge-info { background: rgba(59,130,246,0.12); color: var(--info); }

    /* Key display */
    .key-display { display: flex; align-items: center; gap: 6px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 12px; color: var(--text-muted); max-width: 340px; }
    .key-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; user-select: all; }
    .key-action { flex-shrink: 0; cursor: pointer; padding: 2px 6px; border-radius: 4px; font-size: 14px; background: none; color: var(--text-muted); }
    .key-action:hover { background: rgba(255,255,255,0.08); color: var(--text); }

    /* Code block */
    .code-block { background: var(--input-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px 20px; font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.7; color: #c9d1d9; position: relative; overflow-x: auto; white-space: pre; margin: 12px 0; }
    .code-block .copy-code { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-muted); padding: 4px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; font-family: 'Inter', sans-serif; }
    .code-block .copy-code:hover { background: rgba(255,255,255,0.14); color: var(--text); }
    .code-kw { color: #ff7b72; }
    .code-str { color: #a5d6ff; }
    .code-cmt { color: #8b949e; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
    .pagination-info { font-size: 13px; color: var(--text-muted); }
    .pagination-btns { display: flex; gap: 6px; }

    /* Tabs */
    .filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filter-chip { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--text-muted); transition: all 0.15s; }
    .filter-chip:hover { border-color: var(--primary); color: var(--primary); }
    .filter-chip.active { background: var(--primary-glow); border-color: var(--primary); color: var(--primary); }

    /* Empty state */
    .empty-state { text-align: center; padding: 48px 20px; color: var(--text-muted); }
    .empty-state .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-state .empty-title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .empty-state .empty-desc { font-size: 14px; max-width: 340px; margin: 0 auto; }

    /* Alert box */
    .alert { padding: 14px 18px; border-radius: 10px; font-size: 13px; line-height: 1.6; margin-bottom: 20px; }
    .alert-info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2); color: #93c5fd; }
    .alert-warning { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
    .alert-success { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); color: #6ee7b7; }

    /* Integration steps */
    .step { display: flex; gap: 16px; margin-bottom: 28px; }
    .step-num { width: 32px; height: 32px; border-radius: 50%; background: var(--primary-glow); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; }
    .step-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; }

    /* Toast */
    #toast { visibility: hidden; min-width: 280px; background-color: var(--card-bg); border: 1px solid var(--primary); color: #fff; text-align: center; border-radius: 10px; padding: 14px 20px; position: fixed; z-index: 999; left: 50%; bottom: 30px; transform: translateX(-50%); font-size: 13px; box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
    #toast.show { visibility: visible; animation: fadein 0.3s; }
    #toast.error { border-color: var(--danger); }
    @keyframes fadein { from { bottom: 0; opacity: 0; } to { bottom: 30px; opacity: 1; } }

    .flex { display: flex; gap: 10px; }
    .flex-wrap { flex-wrap: wrap; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .mb-2 { margin-bottom: 8px; }
    .text-center { text-align: center; }
    .text-muted { color: var(--text-muted); }
    .text-sm { font-size: 13px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    @media (max-width: 768px) {
      .sidebar { width: 220px; }
      .main-content { padding: 20px; }
      .grid-2 { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>

  <div id="toast">Message here</div>

  <!-- ===== Auth View ===== -->
  <div id="authView" class="auth-container">
    <div id="loginForm" class="auth-card">
      <div class="auth-header">
        <div style="font-size: 36px; margin-bottom: 12px;">&#x1f4e7;</div>
        <h1>Welcome Back</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">Sign in to your Email API dashboard</p>
      </div>
      <form onsubmit="handleLogin(event)">
        <div class="field">
          <label>Email Address</label>
          <input type="email" id="loginEmail" placeholder="you@company.com" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input type="password" id="loginPassword" placeholder="Enter your password" required>
        </div>
        <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 12px;">Sign In</button>
      </form>
      <div class="text-center mt-4">
        <a href="#" onclick="toggleAuth('register'); return false;" style="font-size: 14px;">Don't have an account? Register</a>
      </div>
    </div>

    <div id="registerForm" class="auth-card" style="display: none;">
      <div class="auth-header">
        <div style="font-size: 36px; margin-bottom: 12px;">&#x1f680;</div>
        <h1>Create Account</h1>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">Start sending emails in minutes</p>
      </div>
      <form onsubmit="handleRegister(event)">
        <div class="field">
          <label>Full Name</label>
          <input type="text" id="registerName" placeholder="John Doe" required>
        </div>
        <div class="field">
          <label>Email Address</label>
          <input type="email" id="registerEmail" placeholder="you@company.com" required>
        </div>
        <div class="field">
          <label>Password (min 6 chars)</label>
          <input type="password" id="registerPassword" placeholder="Create a strong password" required minlength="6">
        </div>
        <button type="submit" class="btn" style="width: 100%; justify-content: center; padding: 12px;">Create Account</button>
      </form>
      <div class="text-center mt-4">
        <a href="#" onclick="toggleAuth('login'); return false;" style="font-size: 14px;">Already have an account? Sign in</a>
      </div>
    </div>
  </div>

  <!-- ===== Main App ===== -->
  <div id="appView" class="app-container" style="display: none;">

    <!-- Sidebar -->
    <div class="sidebar active">
      <div class="sidebar-header">&#x1f4e7; Email API</div>
      <div class="nav-items">
        <div class="nav-item active" onclick="switchTab('overview', this)"><span class="nav-icon">&#x1f4ca;</span> Overview</div>
        <div class="nav-item" onclick="switchTab('apikeys', this)"><span class="nav-icon">&#x1f511;</span> API Keys</div>
        <div class="nav-item" onclick="switchTab('integration', this)"><span class="nav-icon">&#x1f517;</span> Integration</div>
        <div class="nav-item" onclick="switchTab('smtp', this)"><span class="nav-icon">&#x2699;&#xfe0f;</span> SMTP Settings</div>
        <div class="nav-item" onclick="switchTab('logs', this)"><span class="nav-icon">&#x1f4cb;</span> Email Logs</div>
        <div class="nav-item" onclick="switchTab('compose', this)"><span class="nav-icon">&#x270f;&#xfe0f;</span> Test Send</div>
      </div>
      <div class="sidebar-footer">
        <div class="user-info" id="user-email-display"></div>
        <button class="logout-btn" onclick="logout()">&#x1f6aa; Logout</button>
      </div>
    </div>

    <!-- ===== Overview ===== -->
    <div class="main-content active" id="overview">
      <div class="page-title">Dashboard Overview</div>
      <div class="page-desc">Monitor your email sending activity at a glance.</div>

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
          <div class="stat-title">Queued</div>
          <div class="stat-value" style="color: var(--info);" id="stat-queued">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Failed</div>
          <div class="stat-value" style="color: var(--danger);" id="stat-failed">0</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">SMTP Health</div>
          <div id="smtp-health-badge" class="badge badge-warning" style="display: inline-block; padding: 6px 12px; font-size: 12px;">Not Configured</div>
          <p style="margin-top: 12px; color: var(--text-muted); font-size: 13px; line-height: 1.6;">Without custom SMTP, you use the fallback (rate-limited to 100 emails/day). Configure your own SMTP in Settings for unlimited sending.</p>
        </div>
        <div class="card">
          <div class="card-title">Quick Links</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <a href="#" onclick="switchTabById('apikeys'); return false;" style="font-size: 13px;">&#x1f511; Manage API Keys</a>
            <a href="#" onclick="switchTabById('integration'); return false;" style="font-size: 13px;">&#x1f517; Integration Guide</a>
            <a href="#" onclick="switchTabById('smtp'); return false;" style="font-size: 13px;">&#x2699;&#xfe0f; SMTP Settings</a>
            <a href="/health" target="_blank" style="font-size: 13px;">&#x1f49a; Health Check Endpoint</a>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== API Keys ===== -->
    <div class="main-content" id="apikeys">
      <div class="page-title">API Keys</div>
      <div class="page-desc">Create and manage API keys used to authenticate requests to your Email API.</div>

      <div class="alert alert-info">
        <strong>How it works:</strong> Include your API key in the <code>x-api-key</code> header of every request to <code>/notifications/send</code>. You can have up to 10 active keys.
      </div>

      <div class="card">
        <div class="card-title">
          Active Keys
          <button class="btn btn-sm" onclick="generateApiKey()">+ Generate New Key</button>
        </div>
        <div id="api-keys-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>API Key</th>
                <th>Last Used</th>
                <th>Created</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="api-keys-tbody"></tbody>
          </table>
        </div>
        <div id="api-keys-empty" class="empty-state" style="display: none;">
          <div class="empty-icon">&#x1f511;</div>
          <div class="empty-title">No API Keys Yet</div>
          <div class="empty-desc">Generate your first API key to start sending emails programmatically.</div>
          <button class="btn mt-4" onclick="generateApiKey()">Generate Your First Key</button>
        </div>
      </div>

      <!-- New key reveal modal -->
      <div id="new-key-reveal" class="card" style="display: none; border-color: var(--success);">
        <div class="card-title" style="color: var(--success);">&#x2705; New Key Created</div>
        <div class="alert alert-warning">
          <strong>Important:</strong> This is the only time your full API key will be shown. Copy it now and store it securely. It cannot be recovered later.
        </div>
        <div class="key-display" style="max-width: 100%; padding: 14px 16px; font-size: 14px;">
          <span class="key-text" id="new-key-value" style="user-select: all;"></span>
          <button class="key-action" onclick="copyToClipboard(document.getElementById('new-key-value').textContent)" title="Copy">&#x1f4cb;</button>
        </div>
      </div>
    </div>

    <!-- ===== Integration Guide ===== -->
    <div class="main-content" id="integration">
      <div class="page-title">Integration Guide</div>
      <div class="page-desc">Connect your application to the Email API in 3 simple steps.</div>

      <div class="card">
        <div class="card-title">API Endpoint</div>
        <div class="key-display" style="max-width: 100%; padding: 12px 16px; font-size: 14px;">
          <span style="color: var(--success); font-weight: 600; margin-right: 8px;">POST</span>
          <span class="key-text" id="api-base-url"></span>
          <button class="key-action" onclick="copyToClipboard(document.getElementById('api-base-url').textContent)" title="Copy URL">&#x1f4cb;</button>
        </div>
      </div>

      <div class="step">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Get Your API Key</div>
          <div class="step-desc">Go to the <a href="#" onclick="switchTabById('apikeys'); return false;">API Keys</a> page and generate a new key. Store it securely in your application's environment variables.</div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Send Your First Email</div>
          <div class="step-desc">Make a POST request with your API key in the <code>x-api-key</code> header:</div>
          <div class="code-block" id="curl-example">
<button class="copy-code" onclick="copyCodeBlock('curl-example')">Copy</button>
<span class="code-cmt"># Send an email via cURL</span>
curl -X POST <span class="code-str" id="curl-url"></span> \\
  -H <span class="code-str">"Content-Type: application/json"</span> \\
  -H <span class="code-str">"x-api-key: YOUR_API_KEY"</span> \\
  -d '{
    <span class="code-str">"email"</span>: <span class="code-str">"recipient@example.com"</span>,
    <span class="code-str">"subject"</span>: <span class="code-str">"Hello from my app!"</span>,
    <span class="code-str">"body"</span>: <span class="code-str">"&lt;h1&gt;Welcome!&lt;/h1&gt;&lt;p&gt;This works!&lt;/p&gt;"</span>
  }'</div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">3</div>
        <div class="step-content">
          <div class="step-title">Handle the Response</div>
          <div class="step-desc">A successful request returns a <code>201</code> status with the notification ID:</div>
          <div class="code-block" id="response-example">
<button class="copy-code" onclick="copyCodeBlock('response-example')">Copy</button>
{
  <span class="code-str">"id"</span>: <span class="code-str">"a12b34c5-..."</span>,
  <span class="code-str">"message"</span>: <span class="code-str">"Email notification queued"</span>,
  <span class="code-str">"status"</span>: <span class="code-str">"queued"</span>
}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">Node.js / JavaScript Example</div>
        <div class="code-block" id="js-example">
<button class="copy-code" onclick="copyCodeBlock('js-example')">Copy</button>
<span class="code-kw">const</span> response = <span class="code-kw">await</span> fetch(<span class="code-str" id="js-url"></span>, {
  method: <span class="code-str">'POST'</span>,
  headers: {
    <span class="code-str">'Content-Type'</span>: <span class="code-str">'application/json'</span>,
    <span class="code-str">'x-api-key'</span>: process.env.EMAIL_API_KEY,
  },
  body: JSON.stringify({
    email: <span class="code-str">'user@example.com'</span>,
    subject: <span class="code-str">'Welcome!'</span>,
    body: <span class="code-str">'&lt;p&gt;Thanks for signing up!&lt;/p&gt;'</span>,
  }),
});

<span class="code-kw">const</span> data = <span class="code-kw">await</span> response.json();
console.log(data.id); <span class="code-cmt">// notification ID</span></div>
      </div>

      <div class="card">
        <div class="card-title">Python Example</div>
        <div class="code-block" id="py-example">
<button class="copy-code" onclick="copyCodeBlock('py-example')">Copy</button>
<span class="code-kw">import</span> requests

response = requests.post(
    <span class="code-str" id="py-url"></span>,
    headers={
        <span class="code-str">"Content-Type"</span>: <span class="code-str">"application/json"</span>,
        <span class="code-str">"x-api-key"</span>: <span class="code-str">"YOUR_API_KEY"</span>,
    },
    json={
        <span class="code-str">"email"</span>: <span class="code-str">"user@example.com"</span>,
        <span class="code-str">"subject"</span>: <span class="code-str">"Hello!"</span>,
        <span class="code-str">"body"</span>: <span class="code-str">"&lt;p&gt;Email body here&lt;/p&gt;"</span>,
    }
)

print(response.json())</div>
      </div>

      <div class="card">
        <div class="card-title">Request Parameters</div>
        <table>
          <thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>email</code></td><td>string</td><td><span class="badge badge-danger">Yes</span></td><td>Recipient email address</td></tr>
            <tr><td><code>subject</code></td><td>string</td><td><span class="badge badge-danger">Yes</span></td><td>Email subject line</td></tr>
            <tr><td><code>body</code></td><td>string</td><td><span class="badge badge-danger">Yes</span></td><td>HTML email body content</td></tr>
            <tr><td><code>templateId</code></td><td>string</td><td><span class="badge badge-primary">No</span></td><td>ID of a pre-defined template</td></tr>
            <tr><td><code>payload</code></td><td>object</td><td><span class="badge badge-primary">No</span></td><td>Template variables object</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== SMTP Settings ===== -->
    <div class="main-content" id="smtp">
      <div class="page-title">SMTP Settings</div>
      <div class="page-desc">Configure your own SMTP credentials for unlimited email sending.</div>

      <div class="alert alert-info">
        <strong>Why configure SMTP?</strong> Without custom SMTP, your emails use the shared fallback server which is rate-limited to 100 emails/day. Use your own credentials (e.g., Gmail App Password, SendGrid, Mailgun) for unlimited sending.
      </div>

      <div class="card">
        <div class="card-title">SMTP Credentials <span class="badge badge-info" style="font-size: 10px;">AES-256 Encrypted</span></div>
        <form onsubmit="saveSmtp(event)">
          <div class="grid-2">
            <div class="field">
              <label>SMTP Host</label>
              <input type="text" id="smtpHost" placeholder="smtp.gmail.com" required>
            </div>
            <div class="field">
              <label>SMTP Port</label>
              <input type="number" id="smtpPort" placeholder="587" required>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label>Username / Email</label>
              <input type="text" id="smtpUser" placeholder="your-email@gmail.com" required>
            </div>
            <div class="field">
              <label>Password / App Password</label>
              <input type="password" id="smtpPass" required>
              <small style="color: var(--text-dim); font-size: 11px; display: block; margin-top: 4px;">&#x1f512; Encrypted at rest with AES-256-CBC</small>
            </div>
          </div>
          <div class="field">
            <label>Default "From" Address</label>
            <input type="email" id="emailFrom" required placeholder="noreply@yourdomain.com">
          </div>
          <div class="flex flex-wrap">
            <button type="submit" class="btn">Save Settings</button>
            <button type="button" class="btn btn-outline" onclick="verifySmtp()">&#x1f50c; Test Connection</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ===== Email Logs ===== -->
    <div class="main-content" id="logs">
      <div class="page-title">Email Logs</div>
      <div class="page-desc">View the delivery status and history of all your sent emails.</div>

      <div class="filter-bar">
        <button class="filter-chip active" onclick="setLogFilter('all', this)">All</button>
        <button class="filter-chip" onclick="setLogFilter('sent', this)">&#x2705; Sent</button>
        <button class="filter-chip" onclick="setLogFilter('queued', this)">&#x23f3; Queued</button>
        <button class="filter-chip" onclick="setLogFilter('processing', this)">&#x2699;&#xfe0f; Processing</button>
        <button class="filter-chip" onclick="setLogFilter('failed', this)">&#x274c; Failed</button>
        <div style="margin-left: auto;">
          <button class="btn btn-ghost btn-sm" onclick="loadLogs()">&#x1f504; Refresh</button>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Recipient</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Retries</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody id="logs-tbody"></tbody>
        </table>
        <div id="logs-empty" class="empty-state" style="display: none;">
          <div class="empty-icon">&#x1f4ec;</div>
          <div class="empty-title">No Emails Found</div>
          <div class="empty-desc">Send your first email using the Test Send tab or the API to see logs here.</div>
        </div>
      </div>

      <div class="pagination" id="logs-pagination" style="display: none;">
        <div class="pagination-info" id="pagination-info"></div>
        <div class="pagination-btns">
          <button class="btn btn-ghost btn-sm" id="prev-btn" onclick="changePage(-1)">&#x2190; Prev</button>
          <button class="btn btn-ghost btn-sm" id="next-btn" onclick="changePage(1)">Next &#x2192;</button>
        </div>
      </div>
    </div>

    <!-- ===== Compose / Test Send ===== -->
    <div class="main-content" id="compose">
      <div class="page-title">Test Send</div>
      <div class="page-desc">Send a test email to verify your integration is working.</div>

      <div id="compose-no-key" class="alert alert-warning" style="display: none;">
        <strong>No API Key found.</strong> Please <a href="#" onclick="switchTabById('apikeys'); return false;">generate an API key</a> first before sending emails.
      </div>

      <div class="card" style="max-width: 640px;">
        <form onsubmit="sendTestEmail(event)">
          <div class="field">
            <label>Recipient Email</label>
            <input type="email" id="composeEmail" placeholder="test@example.com" required>
          </div>
          <div class="field">
            <label>Subject</label>
            <input type="text" id="composeSubject" placeholder="Test email from my app" required>
          </div>
          <div class="field">
            <label>Body (HTML supported)</label>
            <textarea id="composeBody" required placeholder="<h1>Hello!</h1><p>Your email service is working.</p>"></textarea>
          </div>
          <button type="submit" class="btn" id="composeSendBtn">Send Test Email &#x2192;</button>
        </form>
      </div>
    </div>

  </div>

<script>
  // ===== State =====
  let token = localStorage.getItem('jwt');
  let currentApiKey = null;
  let allApiKeys = [];
  let logCurrentPage = 1;
  let logFilter = 'all';
  let logTotalPages = 1;
  let revealedKeys = {};  // id -> boolean

  // ===== Toast =====
  function showToast(msg, isError) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = isError ? 'show error' : 'show';
    if (t._timer) clearTimeout(t._timer);
    t._timer = setTimeout(function() { t.className = ''; }, 3000);
  }

  // ===== Copy helpers =====
  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() { showToast('Copied to clipboard!'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Copied to clipboard!');
    }
  }

  function copyCodeBlock(id) {
    var el = document.getElementById(id);
    var text = el.textContent.replace('Copy', '').trim();
    copyToClipboard(text);
  }

  // ===== API Fetch =====
  function apiFetch(path, options) {
    if (!options) options = {};
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = 'Bearer ' + token;
    if (path.includes('/send') && currentApiKey) {
      options.headers['x-api-key'] = currentApiKey;
    }
    return fetch(path, options).then(function(res) {
      return res.json().then(function(data) {
        if (res.status === 401) {
          logout();
          showToast('Session expired', true);
          throw new Error('Unauthorized');
        }
        if (!res.ok) throw new Error(data.message || data.error || 'API Error');
        return data;
      });
    });
  }

  // ===== Auth =====
  function toggleAuth(type) {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
  }

  function handleLogin(e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value;
    var password = document.getElementById('loginPassword').value;
    apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    }).then(function(data) {
      token = data.token;
      localStorage.setItem('jwt', token);
      showToast('Login successful!');
      initDashboard();
    }).catch(function(err) { showToast(err.message, true); });
  }

  function handleRegister(e) {
    e.preventDefault();
    var name = document.getElementById('registerName').value;
    var email = document.getElementById('registerEmail').value;
    var password = document.getElementById('registerPassword').value;
    apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, password: password })
    }).then(function(data) {
      token = data.token;
      localStorage.setItem('jwt', token);
      showToast('Registration successful!');
      initDashboard();
    }).catch(function(err) { showToast(err.message, true); });
  }

  function logout() {
    token = null;
    currentApiKey = null;
    allApiKeys = [];
    revealedKeys = {};
    localStorage.removeItem('jwt');
    document.getElementById('appView').style.display = 'none';
    document.getElementById('authView').style.display = 'flex';
  }

  // ===== Navigation =====
  function switchTab(tabId, navEl) {
    document.querySelectorAll('.main-content').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });
    document.getElementById(tabId).classList.add('active');
    if (navEl) navEl.classList.add('active');

    if (tabId === 'overview') loadStats();
    if (tabId === 'apikeys') loadApiKeys();
    if (tabId === 'smtp') loadSmtp();
    if (tabId === 'logs') { logCurrentPage = 1; loadLogs(); }
    if (tabId === 'integration') populateIntegrationUrls();
    if (tabId === 'compose') checkComposeReady();
  }

  function switchTabById(tabId) {
    var navItems = document.querySelectorAll('.nav-item');
    var target = null;
    navItems.forEach(function(el) { if (el.textContent.trim().toLowerCase().indexOf(tabId) > -1 || el.getAttribute('onclick').indexOf(tabId) > -1) target = el; });
    switchTab(tabId, target);
  }

  // ===== Init =====
  function initDashboard() {
    if (!token) return;
    document.getElementById('authView').style.display = 'none';
    document.getElementById('appView').style.display = 'flex';

    // Decode email from JWT for sidebar
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      document.getElementById('user-email-display').textContent = payload.email || '';
    } catch(e) {}

    loadApiKeys().then(function() { loadStats(); });
  }

  // ===== Overview Stats =====
  function loadStats() {
    return apiFetch('/dashboard/stats').then(function(data) {
      document.getElementById('stat-total').textContent = data.totalEmails;
      document.getElementById('stat-sent').textContent = data.sentEmails;
      document.getElementById('stat-queued').textContent = data.queuedEmails;
      document.getElementById('stat-failed').textContent = data.failedEmails;

      var badge = document.getElementById('smtp-health-badge');
      if (data.smtpVerified) {
        badge.className = 'badge badge-success';
        badge.textContent = 'Configured & Verified';
      } else if (data.smtpConfigured) {
        badge.className = 'badge badge-primary';
        badge.textContent = 'Configured (Unverified)';
      } else {
        badge.className = 'badge badge-warning';
        badge.textContent = 'Not Configured (Using Fallback)';
      }
    }).catch(function(e) { console.error(e); });
  }

  // ===== API Keys =====
  function loadApiKeys() {
    return apiFetch('/dashboard/api-keys').then(function(data) {
      allApiKeys = data.keys;
      if (data.keys.length > 0) currentApiKey = data.keys[0].fullKey;
      else currentApiKey = null;
      renderApiKeys();
    }).catch(function(err) { showToast(err.message, true); });
  }

  function renderApiKeys() {
    var tbody = document.getElementById('api-keys-tbody');
    var container = document.getElementById('api-keys-container');
    var empty = document.getElementById('api-keys-empty');

    if (allApiKeys.length === 0) {
      container.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    container.style.display = 'block';
    empty.style.display = 'none';

    var html = '';
    allApiKeys.forEach(function(k) {
      var isRevealed = revealedKeys[k.id];
      var displayKey = isRevealed ? k.fullKey : k.apiKey;
      var toggleIcon = isRevealed ? '&#x1f441;&#xfe0f;' : '&#x1f441;&#x200d;&#x1f5e8;&#xfe0f;';
      var toggleTitle = isRevealed ? 'Hide key' : 'Reveal key';
      var lastUsed = k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never';

      html += '<tr>' +
        '<td><strong>' + escHtml(k.keyName) + '</strong></td>' +
        '<td>' +
          '<div class="key-display">' +
            '<span class="key-text" id="key-text-' + k.id + '">' + escHtml(displayKey) + '</span>' +
            '<button class="key-action" onclick="toggleKeyVisibility(\\'' + k.id + '\\')" title="' + toggleTitle + '">' + toggleIcon + '</button>' +
            '<button class="key-action" onclick="copyToClipboard(\\'' + escHtml(k.fullKey) + '\\')" title="Copy full key">&#x1f4cb;</button>' +
          '</div>' +
        '</td>' +
        '<td style="color: var(--text-muted); font-size: 12px;">' + lastUsed + '</td>' +
        '<td style="color: var(--text-muted); font-size: 12px;">' + new Date(k.createdAt).toLocaleDateString() + '</td>' +
        '<td style="text-align: right;"><button class="btn btn-danger btn-sm" onclick="revokeKey(\\'' + k.id + '\\')">Revoke</button></td>' +
      '</tr>';
    });
    tbody.innerHTML = html;
  }

  function toggleKeyVisibility(id) {
    revealedKeys[id] = !revealedKeys[id];
    renderApiKeys();
  }

  function generateApiKey() {
    apiFetch('/dashboard/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(function(data) {
      showToast('API key created!');
      // Show the new key reveal card
      document.getElementById('new-key-value').textContent = data.apiKey;
      document.getElementById('new-key-reveal').style.display = 'block';
      loadApiKeys();
    }).catch(function(err) { showToast(err.message, true); });
  }

  function revokeKey(id) {
    if (!confirm('Are you sure you want to revoke this key? Any apps using it will stop working.')) return;
    apiFetch('/dashboard/api-keys/' + id, { method: 'DELETE' }).then(function() {
      showToast('API key revoked');
      delete revealedKeys[id];
      loadApiKeys();
    }).catch(function(err) { showToast(err.message, true); });
  }

  // ===== Integration =====
  function populateIntegrationUrls() {
    var base = window.location.origin + '/notifications/send';
    var el1 = document.getElementById('api-base-url');
    if (el1) el1.textContent = base;
    var el2 = document.getElementById('curl-url');
    if (el2) el2.textContent = '"' + base + '"';
    var el3 = document.getElementById('js-url');
    if (el3) el3.textContent = "'" + base + "'";
    var el4 = document.getElementById('py-url');
    if (el4) el4.textContent = '"' + base + '"';
  }

  // ===== SMTP =====
  function loadSmtp() {
    apiFetch('/dashboard/smtp').then(function(data) {
      if (data.configured) {
        document.getElementById('smtpHost').value = data.smtp.smtpHost;
        document.getElementById('smtpPort').value = data.smtp.smtpPort;
        document.getElementById('smtpUser').value = data.smtp.smtpUser;
        document.getElementById('emailFrom').value = data.smtp.emailFrom;
      }
    }).catch(function(e) { console.error(e); });
  }

  function saveSmtp(e) {
    e.preventDefault();
    var payload = {
      smtpHost: document.getElementById('smtpHost').value,
      smtpPort: parseInt(document.getElementById('smtpPort').value),
      smtpSecure: document.getElementById('smtpPort').value === '465',
      smtpUser: document.getElementById('smtpUser').value,
      smtpPass: document.getElementById('smtpPass').value,
      emailFrom: document.getElementById('emailFrom').value,
    };
    apiFetch('/dashboard/smtp', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function() {
      showToast('SMTP settings saved!');
      document.getElementById('smtpPass').value = '';
      loadStats();
    }).catch(function(err) { showToast(err.message, true); });
  }

  function verifySmtp() {
    showToast('Testing SMTP connection...');
    apiFetch('/dashboard/smtp/verify', { method: 'POST' }).then(function(data) {
      showToast(data.message);
      loadStats();
    }).catch(function(err) { showToast(err.message, true); });
  }

  // ===== Email Logs =====
  function setLogFilter(filter, chipEl) {
    logFilter = filter;
    logCurrentPage = 1;
    document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
    if (chipEl) chipEl.classList.add('active');
    loadLogs();
  }

  function loadLogs() {
    var url = '/dashboard/emails?page=' + logCurrentPage + '&limit=15';
    apiFetch(url).then(function(data) {
      var tbody = document.getElementById('logs-tbody');
      var emptyEl = document.getElementById('logs-empty');
      var pagEl = document.getElementById('logs-pagination');

      // Client-side filter
      var filtered = data.emails;
      if (logFilter !== 'all') {
        filtered = data.emails.filter(function(e) { return e.status === logFilter; });
      }

      if (data.emails.length === 0) {
        tbody.innerHTML = '';
        emptyEl.style.display = 'block';
        pagEl.style.display = 'none';
        return;
      }
      emptyEl.style.display = 'none';

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">No emails match this filter.</td></tr>';
        pagEl.style.display = 'none';
        return;
      }

      var html = '';
      filtered.forEach(function(e) {
        var statusClass = 'badge-primary';
        var statusIcon = '&#x23f3;';
        if (e.status === 'sent') { statusClass = 'badge-success'; statusIcon = '&#x2705;'; }
        else if (e.status === 'failed' || e.status === 'dlq') { statusClass = 'badge-danger'; statusIcon = '&#x274c;'; }
        else if (e.status === 'processing') { statusClass = 'badge-info'; statusIcon = '&#x2699;&#xfe0f;'; }

        var failInfo = e.failureReason ? '<span style="color: var(--danger); font-size: 11px; display: block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="' + escAttr(e.failureReason) + '">' + escHtml(e.failureReason) + '</span>' : '<span style="color: var(--text-dim); font-size: 11px;">-</span>';

        html += '<tr>' +
          '<td style="white-space: nowrap; font-size: 12px; color: var(--text-muted);">' + formatDate(e.createdAt) + '</td>' +
          '<td>' + escHtml(e.email) + '</td>' +
          '<td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escHtml(e.subject || '-') + '</td>' +
          '<td><span class="badge ' + statusClass + '">' + statusIcon + ' ' + e.status + '</span></td>' +
          '<td style="text-align: center;">' + (e.retryCount || 0) + '</td>' +
          '<td>' + failInfo + '</td>' +
        '</tr>';
      });
      tbody.innerHTML = html;

      // Pagination
      logTotalPages = data.pagination.totalPages;
      if (data.pagination.totalPages > 1) {
        pagEl.style.display = 'flex';
        document.getElementById('pagination-info').textContent = 'Page ' + data.pagination.page + ' of ' + data.pagination.totalPages + ' (' + data.pagination.total + ' total)';
        document.getElementById('prev-btn').disabled = data.pagination.page <= 1;
        document.getElementById('next-btn').disabled = data.pagination.page >= data.pagination.totalPages;
      } else {
        pagEl.style.display = 'none';
      }
    }).catch(function(err) { showToast(err.message, true); });
  }

  function changePage(delta) {
    logCurrentPage += delta;
    if (logCurrentPage < 1) logCurrentPage = 1;
    if (logCurrentPage > logTotalPages) logCurrentPage = logTotalPages;
    loadLogs();
  }

  // ===== Compose =====
  function checkComposeReady() {
    var noKeyAlert = document.getElementById('compose-no-key');
    if (!currentApiKey) { noKeyAlert.style.display = 'block'; }
    else { noKeyAlert.style.display = 'none'; }
  }

  function sendTestEmail(e) {
    e.preventDefault();
    if (!currentApiKey) { showToast('Generate an API key first', true); return; }
    var btn = document.getElementById('composeSendBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var payload = {
      email: document.getElementById('composeEmail').value,
      subject: document.getElementById('composeSubject').value,
      body: document.getElementById('composeBody').value,
    };

    apiFetch('/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(data) {
      showToast('Email queued! ID: ' + (data.id || '').slice(0,8) + '...');
      document.getElementById('composeEmail').value = '';
      document.getElementById('composeSubject').value = '';
      document.getElementById('composeBody').value = '';
      setTimeout(loadStats, 1500);
    }).catch(function(err) {
      showToast(err.message, true);
    }).finally(function() {
      btn.disabled = false;
      btn.textContent = 'Send Test Email \\u2192';
    });
  }

  // ===== Helpers =====
  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function formatDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    var mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return mon[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ===== Boot =====
  if (token) initDashboard();
</script>
</body>
</html>`;
