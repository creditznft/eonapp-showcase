const TASKS_KEY = 'eon:business:tasks:v1';
const REMINDERS_KEY = 'eon:business:reminders:v1';

function loadArray(/** @type {any} */ key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArray(/** @type {any} */ key, /** @type {any} */ rows) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(rows) ? rows : []));
  } catch {}
}

function uid(/** @type {any} */ prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listBusinessTasks() {
  return loadArray(TASKS_KEY);
}

export function createBusinessTask(/** @type {any} */ { title, owner = 'operator', priority = 'medium', dueAt = null, status = 'todo', tags = [] }) {
  const /** @type {any} */
task = {
    id: uid('task'),
    title: String(title || '').trim().slice(0, 180),
    owner: String(owner || 'operator').trim().slice(0, 80),
    priority: ['low', 'medium', 'high', 'critical'].includes(priority) ? priority : 'medium',
    dueAt: dueAt || null,
    status: ['todo', 'in_progress', 'blocked', 'done'].includes(status) ? status : 'todo',
    tags: Array.isArray(tags) ? tags.map((/** @type {any} */ tag) => String(tag || '').trim().toLowerCase()).filter(Boolean).slice(0, 10) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const rows = listBusinessTasks();
  rows.unshift(task);
  saveArray(TASKS_KEY, rows.slice(0, 500));
  return task;
}

export function updateBusinessTask(/** @type {any} */ taskId, /** @type {any} */ patch = {}) {
  const now = new Date().toISOString();
  const rows = listBusinessTasks().map((/** @type {any} */ task) => {
    if (task.id !== taskId) return task;
    return { ...task, ...patch, updatedAt: now };
  });
  saveArray(TASKS_KEY, rows);
}

export function listBusinessReminders() {
  return loadArray(REMINDERS_KEY);
}

export function createBusinessReminder(/** @type {any} */ { taskId = '', title = '', remindAt, cadence = 'once', channel = 'in_app' }) {
  const /** @type {any} */
reminder = {
    id: uid('reminder'),
    taskId: String(taskId || '').trim(),
    title: String(title || '').trim().slice(0, 180),
    remindAt: String(remindAt || '').trim(),
    cadence: ['once', 'daily', 'weekly', 'monthly'].includes(cadence) ? cadence : 'once',
    channel: ['in_app', 'email', 'sms'].includes(channel) ? channel : 'in_app',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const rows = listBusinessReminders();
  rows.unshift(reminder);
  saveArray(REMINDERS_KEY, rows.slice(0, 500));
  return reminder;
}

export function listDueBusinessReminders(/** @type {any} */ nowIso = new Date().toISOString()) {
  const nowTs = Date.parse(nowIso);
  return listBusinessReminders().filter((/** @type {any} */ reminder) => {
    if (!reminder.active) return false;
    const ts = Date.parse(reminder.remindAt || '');
    return Number.isFinite(ts) && ts <= nowTs;
  });
}
