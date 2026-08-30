import { EonCity3dEngine } from '/assets/js/realm3d/engine/EngineBoot.js';

const params = new URLSearchParams(location.search);
const root = document.querySelector('#qa-root');
window.EON_CITY_3D = new EonCity3dEngine(root, {
  quality: params.get('quality') || 'standard',
  world: params.get('world') || 'eon-city'
}).boot();
