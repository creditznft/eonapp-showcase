$ErrorActionPreference = "Stop"
npm ci
npm run qa:w121-w133-visual-overhaul
npm run qa:w119-w120-final-handoff
npm run qa:w118-mobile-optimization
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
