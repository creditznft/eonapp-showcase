import { spawn } from 'node:child_process';

export const EON_LOCAL_COMPANION_RUNTIME_MANAGER_SCHEMA = 'eon.local-companion.runtime-manager.rt90.v1';

const START_SPECS = Object.freeze({
  lmstudio: Object.freeze({
    id: 'lmstudio',
    label: 'LM Studio',
    command: 'lms',
    args: Object.freeze(['server', 'start', '--port', '1234', '--bind', '127.0.0.1']),
    env: Object.freeze({ LMS_SERVER_HOST: '127.0.0.1' })
  }),
  ollama: Object.freeze({
    id: 'ollama',
    label: 'Ollama',
    command: 'ollama',
    args: Object.freeze(['serve']),
    env: Object.freeze({ OLLAMA_HOST: '127.0.0.1:11434' })
  }),
  comfyui: Object.freeze({
    id: 'comfyui',
    label: 'ComfyUI',
    command: 'comfy',
    args: Object.freeze(['launch']),
    env: Object.freeze({})
  })
});

function cleanRuntimeId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
}

export function listEonLocalCompanionStartableRuntimes() {
  return Object.freeze(Object.values(START_SPECS).map(({ id, label }) => Object.freeze({ id, label })));
}

/**
 * Starts one already-installed reviewed runtime with a fixed executable and
 * fixed arguments. The caller cannot supply a path, command, arguments,
 * working directory or environment values. This is runtime start only: it
 * never installs software, downloads a model or escalates privileges.
 */
export async function startEonLocalCompanionRuntime(runtimeId = '', { platform = process.platform } = {}) {
  const id = cleanRuntimeId(runtimeId);
  const spec = START_SPECS[id];
  if (!spec) return Object.freeze({ ok: false, schema: EON_LOCAL_COMPANION_RUNTIME_MANAGER_SCHEMA, error: 'runtime-not-allowlisted', runtimeId: id });
  if (id === 'comfyui' && !['win32', 'darwin', 'linux'].includes(String(platform))) {
    return Object.freeze({ ok: false, schema: EON_LOCAL_COMPANION_RUNTIME_MANAGER_SCHEMA, error: 'platform-not-supported', runtimeId: id });
  }

  return new Promise((resolve) => {
    let settled = false;
    let child;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(Object.freeze({ schema: EON_LOCAL_COMPANION_RUNTIME_MANAGER_SCHEMA, runtimeId: id, label: spec.label, ...payload }));
    };
    try {
      child = spawn(spec.command, [...spec.args], {
        shell: false,
        detached: true,
        windowsHide: true,
        stdio: 'ignore',
        env: { ...process.env, ...spec.env }
      });
      child.once('error', (error) => {
        const code = String(error?.code || '').toUpperCase();
        finish({ ok: false, error: code === 'ENOENT' ? 'runtime-command-not-found' : 'runtime-start-failed' });
      });
      child.once('spawn', () => {
        try { child.unref(); } catch {}
        finish({ ok: true, accepted: true, commandClass: 'fixed-reviewed-runtime-start' });
      });
    } catch {
      finish({ ok: false, error: 'runtime-start-failed' });
    }
  });
}

export function validateEonLocalCompanionRuntimeManager() {
  const errors = [];
  for (const [id, spec] of Object.entries(START_SPECS)) {
    if (id !== spec.id || !spec.command || !Array.isArray(spec.args)) errors.push(`invalid-start-spec:${id}`);
    if (spec.args.some((arg) => /[;&|><`$]/.test(String(arg)))) errors.push(`unsafe-start-arg:${id}`);
  }
  if ('jan' in START_SPECS) errors.push('jan-start-must-remain-unimplemented-until-an-official-reviewed-start-command-exists');
  return errors;
}
