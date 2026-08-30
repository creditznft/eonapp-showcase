$ErrorActionPreference = "Stop"
npm ci
npm run build
npm run qa:w105-performance
npm run qa:w105-performance:browser
npm run audit:site
npm run smoke:build
npm run qa:w104-trading-lab
