#!/usr/bin/env node
console.log('W134 security note: @lhci/cli is not installed as a project dependency because its current transitive tree includes npm audit advisories through tmp/uuid/inquirer.');
console.log('Use npm run audit:site, npm run smoke:build, and npm run qa:w105-performance for checked local gates. For a one-off Lighthouse report, run Chrome DevTools Lighthouse or npx @lhci/cli in an isolated temporary environment after reviewing advisories.');
