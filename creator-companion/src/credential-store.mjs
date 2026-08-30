/** W626B — OS-user-bound credential storage. No browser key persistence. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SERVICE = 'EONAPP-Creator-Companion';
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{1,63}$/i;

function assertName(name = '') {
  if (!SAFE_NAME.test(String(name))) throw new Error('credential name rejected');
  return String(name);
}
function run(command, args, { input = '' } = {}) {
  const result = spawnSync(command, args, { input, encoding: 'utf8', windowsHide: true, timeout: 15000 });
  if (result.error || result.status !== 0) throw new Error(String(result.stderr || result.error?.message || 'secure credential command failed').trim());
  return String(result.stdout || '').trim();
}
function windowsPath(name) {
  const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const directory = path.join(base, 'EONAPP', 'CreatorCompanion', 'credentials');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  return path.join(directory, `${name}.dpapi`);
}
function powershell(script, input = '') { return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { input }); }

function windowsStore() {
  return {
    kind: 'windows-dpapi-current-user',
    set(name, value) {
      const file = windowsPath(assertName(name));
      const script = `$v=[Console]::In.ReadToEnd();$b=[Text.Encoding]::UTF8.GetBytes($v);$e=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[IO.File]::WriteAllBytes('${file.replaceAll("'", "''")}', $e)`;
      powershell(script, String(value));
    },
    get(name) {
      const file = windowsPath(assertName(name));
      if (!fs.existsSync(file)) return '';
      const script = `$e=[IO.File]::ReadAllBytes('${file.replaceAll("'", "''")}');$b=[Security.Cryptography.ProtectedData]::Unprotect($e,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Text.Encoding]::UTF8.GetString($b))`;
      return powershell(script);
    },
    delete(name) { fs.rmSync(windowsPath(assertName(name)), { force: true }); }
  };
}
function macStore() {
  return {
    kind: 'macos-keychain',
    set(name, value) { run('security', ['add-generic-password', '-U', '-s', SERVICE, '-a', assertName(name), '-w', String(value)]); },
    get(name) { try { return run('security', ['find-generic-password', '-s', SERVICE, '-a', assertName(name), '-w']); } catch { return ''; } },
    delete(name) { try { run('security', ['delete-generic-password', '-s', SERVICE, '-a', assertName(name)]); } catch {} }
  };
}
function linuxStore() {
  return {
    kind: 'linux-secret-service',
    set(name, value) { run('secret-tool', ['store', '--label', SERVICE, 'service', SERVICE, 'account', assertName(name)], { input: String(value) }); },
    get(name) { try { return run('secret-tool', ['lookup', 'service', SERVICE, 'account', assertName(name)]); } catch { return ''; } },
    delete(name) { try { run('secret-tool', ['clear', 'service', SERVICE, 'account', assertName(name)]); } catch {} }
  };
}

export function createOsCredentialStore({ platform = process.platform } = {}) {
  if (platform === 'win32') return windowsStore();
  if (platform === 'darwin') return macStore();
  if (platform === 'linux') return linuxStore();
  throw new Error('No reviewed OS secure credential store is available for this platform');
}

export function getCredentialStoreTruth() {
  return Object.freeze({ browserStorageAllowed: false, windows: 'DPAPI CurrentUser', macos: 'Keychain generic password', linux: 'Secret Service via secret-tool', automaticDependencyInstallation: false, plaintextFileFallback: false });
}
