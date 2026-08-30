import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['run', 'qa:w170-eoncity-mobile-ux']],
  ['npm', ['run', 'qa:w171-eonbot-operator']],
  ['npm', ['run', 'qa:w172-unified-reward-center']],
  ['npm', ['run', 'qa:w173-mobile-game-automation-lab']],
  ['npm', ['run', 'qa:w174-public-trust-polish']],
  ['npm', ['run', 'qa:w175-real-payment-proof']],
  ['node', ['--test', 'tests/unit/w170-w175-launch-wave.test.mjs']]
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log('W170-W175 consolidated launch wave gate passed');
