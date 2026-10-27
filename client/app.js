// client/app.js
/* =========================================================
   SYNAPSE HACKATHON 2026 - Client Application Logic
   ========================================================= */

const API_BASE = 'http://localhost:5002/api';

// ---------- State ----------
let currentUser = null;
let currentProject = null;

// ---------- DOM Utilities ----------
function show(el) { if (el) el.classList.remove('hidden'); }
function hide(el) { if (el) el.classList.add('hidden'); }
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return document.querySelectorAll(sel); }

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// ---------- API Service ----------
async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---------- Tab Navigation ----------
function switchTab(tabId) {
  // Update nav buttons
  qsa('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update panes
  qsa('.tab-pane').forEach(pane => {
    pane.classList.remove('active');
  });

  const targetPane = qs(`#pane-${tabId}`);
  if (targetPane) {
    targetPane.classList.add('active');
  }

  // If opening workspace, check auth state
  if (tabId === 'workspace') {
    updateWorkspaceVisibility();
  }

  refreshIcons();
}

function updateWorkspaceVisibility() {
  const gate = qs('#workspace-gate');
  const content = qs('#workspace-content');
  if (currentUser) {
    hide(gate);
    show(content);
    loadProjects();
  } else {
    show(gate);
    hide(content);
  }
}

// ---------- Auth Handlers ----------
async function login(email, password) {
  const data = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.success) {
    currentUser = { email };
    afterAuth(email);
  }
}

async function register(name, email, password) {
  const data = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (data.success) {
    currentUser = { email, name };
    afterAuth(email);
  }
}

async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (err) {
    console.error('Logout error:', err);
  }
  currentUser = null;
  hide(qs('#user-nav'));
  show(qs('#auth-nav'));
  updateWorkspaceVisibility();
  refreshIcons();
}

function afterAuth(email) {
  qs('#user-email').textContent = email;
  hide(qs('#auth-nav'));
  show(qs('#user-nav'));
  updateWorkspaceVisibility();
  refreshIcons();
}

// ---------- Projects ----------
async function loadProjects() {
  try {
    const { data: projects } = await api('/projects');
    const container = qs('#projects-list');
    container.innerHTML = '';

    if (!projects || projects.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px dashed rgba(255,255,255,0.15);">
          <div style="font-size: 2.2rem; margin-bottom: 0.8rem;">🚀</div>
          <h3 style="font-size: 1.3rem; margin-bottom: 0.4rem; color: #fff;">No Hackathon Projects Yet</h3>
          <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Start building your hackathon entry now. Assemble your tasks and prototype details.</p>
          <button class="btn btn-primary" onclick="openModal('#project-modal')">
            <i data-lucide="plus"></i> Create First Project
          </button>
        </div>
      `;
      refreshIcons();
      return;
    }

    projects.forEach(p => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-header">
          <span class="project-badge">Active Prototype</span>
          <div class="project-card-actions">
            <button class="project-delete-btn" title="Delete Project"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.description || 'No description provided for this hackathon build.')}</p>
        <div class="project-card-footer">
          <span>Sprint Tasks Board</span>
          <span class="project-open-link">Open Sprint Board <i data-lucide="arrow-right"></i></span>
        </div>
      `;

      // Delete project click
      const deleteBtn = card.querySelector('.project-delete-btn');
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteProject(p._id, p.name);
      });

      // Card click opens tasks
      card.addEventListener('click', () => loadTasks(p));
      container.appendChild(card);
    });

    refreshIcons();
  } catch (err) {
    console.error('Failed to load projects:', err);
  }
}

async function createProject(name, description) {
  await api('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
  await loadProjects();
}

async function deleteProject(projectId, projectName) {
  if (!confirm(`Are you sure you want to delete project "${projectName}"?`)) return;
  try {
    await api(`/projects/${projectId}`, { method: 'DELETE' });
    await loadProjects();
  } catch (err) {
    alert(`Failed to delete project: ${err.message}`);
  }
}

// ---------- Tasks Kanban ----------
async function loadTasks(project) {
  currentProject = project;
  qs('#tasks-title').textContent = `${project.name} – Sprint Board`;
  qs('#tasks-subtitle').textContent = project.description || 'Manage project sprints and priority tasks.';

  const todoList = qs('#list-todo');
  const inProgressList = qs('#list-in-progress');
  const doneList = qs('#list-done');

  todoList.innerHTML = '';
  inProgressList.innerHTML = '';
  doneList.innerHTML = '';

  let todoCount = 0;
  let inProgressCount = 0;
  let doneCount = 0;

  try {
    const { data: tasks } = await api(`/tasks/project/${project._id}`);

    tasks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'task-card';

      const priorityClass = t.priority ? t.priority.toLowerCase() : 'medium';
      const priorityLabel = priorityClass === 'high' ? 'High 🔥' : (priorityClass === 'low' ? 'Low 🛡️' : 'Medium ⚡');

      // Top action controls (Edit, Delete)
      let footerHtml = '';
      if (t.status === 'todo') {
        footerHtml = `
          <div class="task-card-footer">
            <span style="font-size:0.75rem; color:var(--text-dim);">Status: To-Do</span>
            <button class="task-move-btn btn-forward" data-next="in-progress">
              Start ➔ <i data-lucide="arrow-right"></i>
            </button>
          </div>
        `;
      } else if (t.status === 'in-progress') {
        footerHtml = `
          <div class="task-card-footer">
            <button class="task-move-btn btn-prev" data-next="todo">
              <i data-lucide="arrow-left"></i> To-Do
            </button>
            <button class="task-move-btn btn-complete" data-next="done">
              Done ✓ <i data-lucide="check"></i>
            </button>
          </div>
        `;
      } else if (t.status === 'done') {
        footerHtml = `
          <div class="task-card-footer">
            <button class="task-move-btn btn-prev" data-next="in-progress">
              <i data-lucide="rotate-ccw"></i> Reopen
            </button>
            <span style="font-size:0.75rem; color:#34d399; font-weight:600; display:flex; align-items:center; gap:0.25rem;">
              <i data-lucide="check-circle" style="width:13px; height:13px;"></i> Completed
            </span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="task-card-top">
          <span class="priority-tag ${priorityClass}">${priorityLabel}</span>
          <div class="task-card-top-actions">
            <button class="task-icon-btn btn-edit" title="Edit Task"><i data-lucide="edit-3"></i></button>
            <button class="task-icon-btn btn-delete" title="Delete Task"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <h4>${escapeHtml(t.title)}</h4>
        <p>${escapeHtml(t.description || '')}</p>
        ${footerHtml}
      `;

      // Move task buttons event listeners
      card.querySelectorAll('.task-move-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetStatus = btn.dataset.next;
          await moveTask(t._id, targetStatus);
        });
      });

      // Edit task button
      const editBtn = card.querySelector('.btn-edit');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditTaskModal(t);
        });
      }

      // Delete task button
      const deleteBtn = card.querySelector('.btn-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await deleteTask(t._id, t.title);
        });
      }

      // Add to respective column
      if (t.status === 'in-progress') {
        inProgressList.appendChild(card);
        inProgressCount++;
      } else if (t.status === 'done') {
        doneList.appendChild(card);
        doneCount++;
      } else {
        todoList.appendChild(card);
        todoCount++;
      }
    });

    qs('#count-todo').textContent = todoCount;
    qs('#count-in-progress').textContent = inProgressCount;
    qs('#count-done').textContent = doneCount;

    hide(qs('#projects-section'));
    show(qs('#tasks-section'));
    refreshIcons();
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
}

// Move task status directly
async function moveTask(taskId, newStatus) {
  try {
    await api(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    await loadTasks(currentProject);
  } catch (err) {
    alert(`Failed to update task status: ${err.message}`);
  }
}

// Delete task
async function deleteTask(taskId, taskTitle) {
  if (!confirm(`Are you sure you want to delete task: "${taskTitle}"?`)) return;
  try {
    await api(`/tasks/${taskId}`, { method: 'DELETE' });
    await loadTasks(currentProject);
  } catch (err) {
    alert(`Failed to delete task: ${err.message}`);
  }
}

// Open Edit Task modal
function openEditTaskModal(task) {
  qs('#edit-task-id').value = task._id;
  qs('#edit-task-title').value = task.title || '';
  qs('#edit-task-desc').value = task.description || '';
  qs('#edit-task-status').value = task.status || 'todo';
  qs('#edit-task-priority').value = task.priority || 'medium';
  openModal('#edit-task-modal');
}

async function createTask(title, description, status, priority) {
  if (!currentProject) return;
  await api('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title,
      description,
      status,
      priority,
      project: currentProject._id,
    }),
  });
  await loadTasks(currentProject);
}

// ---------- Modals ----------
function openModal(selector) {
  show(qs('#modal-overlay'));
  show(qs(selector));
  refreshIcons();
}

function closeModal(selector) {
  hide(qs(selector));
  if (qsa('.modal:not(.hidden)').length === 0) {
    hide(qs('#modal-overlay'));
  }
}

function closeAllModals() {
  qsa('.modal').forEach(m => hide(m));
  hide(qs('#modal-overlay'));
}

// Helper to escape HTML and prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Countdown Timer ----------
function initCountdown() {
  const targetDate = new Date(Date.now() + (36 * 60 + 42) * 60 * 1000);

  function update() {
    const diff = Math.max(0, targetDate - new Date());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const hStr = String(hours).padStart(2, '0');
    const mStr = String(mins).padStart(2, '0');
    const sStr = String(secs).padStart(2, '0');

    const cdHours = qs('#cd-hours');
    const cdMins = qs('#cd-mins');
    const cdSecs = qs('#cd-secs');
    const ticker = qs('#ticker-time');

    if (cdHours) cdHours.textContent = hStr;
    if (cdMins) cdMins.textContent = mStr;
    if (cdSecs) cdSecs.textContent = sStr;
    if (ticker) ticker.textContent = `${hours}h ${mStr}m`;
  }

  update();
  setInterval(update, 1000);
}

// ---------- Event Listeners Setup ----------
function setupListeners() {
  // Tab clicks
  qsa('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Hero CTA clicks
  const heroWorkspaceBtn = qs('#hero-workspace-btn');
  if (heroWorkspaceBtn) {
    heroWorkspaceBtn.addEventListener('click', () => switchTab('workspace'));
  }

  const heroScheduleBtn = qs('#hero-schedule-btn');
  if (heroScheduleBtn) {
    heroScheduleBtn.addEventListener('click', () => switchTab('schedule'));
  }

  // Auth gate buttons inside workspace
  const gateLoginBtn = qs('#gate-login-btn');
  if (gateLoginBtn) {
    gateLoginBtn.addEventListener('click', () => {
      setAuthModalMode(true);
      openModal('#auth-modal');
    });
  }

  const gateRegBtn = qs('#gate-register-btn');
  if (gateRegBtn) {
    gateRegBtn.addEventListener('click', () => {
      setAuthModalMode(false);
      openModal('#auth-modal');
    });
  }

  // Header Auth buttons
  qs('#login-btn').addEventListener('click', () => {
    setAuthModalMode(true);
    openModal('#auth-modal');
  });

  qs('#register-btn').addEventListener('click', () => {
    setAuthModalMode(false);
    openModal('#auth-modal');
  });

  qs('#logout-btn').addEventListener('click', logout);

  // Toggle Login/Register inside modal
  qs('#toggle-link').addEventListener('click', e => {
    e.preventDefault();
    const isLogin = qs('#auth-modal-title').textContent.includes('Sign In');
    setAuthModalMode(!isLogin);
  });

  function setAuthModalMode(isLogin) {
    qs('#auth-modal-title').textContent = isLogin ? 'Sign In to TaskFlow' : 'Register Hackathon Team';
    qs('#auth-modal-subtitle').textContent = isLogin ? 'Enter your hackathon team credentials' : 'Create your squad profile to start building';
    qs('#auth-submit-btn').innerHTML = `<i data-lucide="${isLogin ? 'arrow-right' : 'user-plus'}"></i> ${isLogin ? 'Sign In' : 'Create Account'}`;
    qs('#auth-toggle').innerHTML = isLogin
      ? 'Need to register a team? <a href="#" id="toggle-link">Create Account</a>'
      : 'Already have an account? <a href="#" id="toggle-link">Sign In</a>';

    const nameGroup = qs('#group-name');
    if (isLogin) {
      hide(nameGroup);
      qs('#name').removeAttribute('required');
    } else {
      show(nameGroup);
      qs('#name').setAttribute('required', 'true');
    }

    refreshIcons();
  }

  // Auth form submit
  qs('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = qs('#email').value.trim();
    const password = qs('#password').value;
    const isLogin = qs('#auth-modal-title').textContent.includes('Sign In');
    const name = qs('#name') ? qs('#name').value.trim() : 'Hacker';

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name || 'Team Hacker', email, password);
      }
      closeModal('#auth-modal');
      qs('#auth-form').reset();
      switchTab('workspace');
    } catch (err) {
      alert(`Authentication failed: ${err.message}`);
    }
  });

  // Projects
  qs('#new-project-btn').addEventListener('click', () => openModal('#project-modal'));
  qs('#project-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = qs('#project-name').value.trim();
    const desc = qs('#project-desc').value.trim();
    try {
      await createProject(name, desc);
      closeModal('#project-modal');
      qs('#project-form').reset();
    } catch (err) {
      alert(`Failed to create project: ${err.message}`);
    }
  });

  // Add Task
  qs('#new-task-btn').addEventListener('click', () => openModal('#task-modal'));
  qs('#task-form').addEventListener('submit', async e => {
    e.preventDefault();
    const title = qs('#task-title').value.trim();
    const desc = qs('#task-desc').value.trim();
    const status = qs('#task-status').value;
    const priority = qs('#task-priority').value;
    try {
      await createTask(title, desc, status, priority);
      closeModal('#task-modal');
      qs('#task-form').reset();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    }
  });

  // Edit Task
  qs('#edit-task-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = qs('#edit-task-id').value;
    const title = qs('#edit-task-title').value.trim();
    const desc = qs('#edit-task-desc').value.trim();
    const status = qs('#edit-task-status').value;
    const priority = qs('#edit-task-priority').value;

    try {
      await api(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description: desc, status, priority }),
      });
      closeModal('#edit-task-modal');
      await loadTasks(currentProject);
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    }
  });

  // Back to projects
  qs('#back-to-projects').addEventListener('click', () => {
    hide(qs('#tasks-section'));
    show(qs('#projects-section'));
    loadProjects();
  });

  // Modal close buttons
  qsa('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.close;
      closeModal(target);
    });
  });

  qs('#modal-overlay').addEventListener('click', closeAllModals);

  // Keyboard Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}

// ---------- App Initialization ----------
(async function init() {
  initCountdown();
  setupListeners();
  refreshIcons();

  // Check if session exists via /auth/me
  try {
    const { data: user } = await api('/auth/me');
    if (user && user.email) {
      currentUser = user;
      afterAuth(user.email);
    }
  } catch (_) {
    // Guest visitor - remains on Home Hackathon Hub
  }
})();
