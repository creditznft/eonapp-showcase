/**
 * W719.13 — pure spatial-surface projection shared by the Babylon NEXUS renderer.
 *
 * This module contains no Babylon dependency. It converts the existing bounded
 * NEXUS scene plan or Project Atlas model into one immutable spatial surface so
 * renderer behavior can be certified independently from WebGL availability.
 */
export const EON_NEXUS_W719_SPATIAL_SURFACE_SCHEMA = 'eon.nexus.w719.spatial-surface.v1';
export const EON_NEXUS_W719_MAX_SPATIAL_OBJECTS = 10;
const freeze = Object.freeze;

function cleanSpatialLabel(value = '', fallback = 'Work object') {
  const label = String(value || fallback).replace(/\s+/g, ' ').trim();
  return (label || fallback).slice(0, 54);
}

function projectAtlasPosition(node = {}) {
  const x = Math.max(5, Math.min(95, Number(node.x) || 50));
  const y = Math.max(5, Math.min(95, Number(node.y) || 50));
  const depth = Math.max(-5, Math.min(7, Number(node.z) || 0));
  return freeze({
    x: Number(((x - 50) * 0.076).toFixed(3)),
    y: Number(((50 - y) * 0.052 + Math.max(0, depth) * 0.08).toFixed(3)),
    z: Number((depth * 0.34).toFixed(3))
  });
}

function defaultAtlasAnchors() {
  return freeze([
    freeze({ id: 'atlas-projects', label: 'Projects', meta: 'Create or choose work', kind: 'project', position: freeze({ x: -2.7, y: 1.35, z: 0.2 }) }),
    freeze({ id: 'atlas-chat', label: 'Recent Chat', meta: 'Return to conversation', kind: 'conversation', position: freeze({ x: 2.55, y: 1.15, z: -0.25 }) }),
    freeze({ id: 'atlas-city', label: 'EON City', meta: 'Explore the spatial map', kind: 'route', position: freeze({ x: 0.15, y: -1.75, z: 1.15 }) }),
    freeze({ id: 'atlas-help', label: 'Help', meta: 'Understand Atlas', kind: 'tool', position: freeze({ x: 0.1, y: 2.75, z: -0.9 }) })
  ]);
}

export function getEonNexusW719SpatialSurface(plan = {}, {
  activeTab = 'conversation',
  atlasSpatialModel = null
} = {}) {
  if (activeTab !== 'atlas') {
    return freeze({
      schema: EON_NEXUS_W719_SPATIAL_SURFACE_SCHEMA,
      surface: 'nexus',
      centre: freeze({ id: 'eon-nexus-core', label: 'EON NEXUS', meta: cleanSpatialLabel(plan?.state || 'Ready', 'Ready'), kind: 'core', position: freeze({ x: 0, y: 0, z: 0 }) }),
      objects: freeze((plan?.spatialScene?.objects || []).slice(0, EON_NEXUS_W719_MAX_SPATIAL_OBJECTS).map((object) => freeze({ ...object, label: cleanSpatialLabel(object.label), meta: cleanSpatialLabel(object.sourceObject?.meta || object.status, object.status || 'Ready') }))),
      relations: freeze([...(plan?.spatialScene?.relations || [])]),
      camera: plan?.spatialScene?.camera || freeze({ alpha: -Math.PI / 2, beta: 1.08, radius: 8.1, minRadius: 5.8, maxRadius: 10.5, lowerBetaLimit: 0.72, upperBetaLimit: 1.42, target: freeze({ x: 0, y: 0, z: 0 }), authorityKey: 'nexus:centre' }),
      accent: plan?.accent || '#22d3ee',
      secondaryAccent: plan?.secondaryAccent || '#8b5cf6',
      selected: true,
      empty: false
    });
  }

  const atlas = atlasSpatialModel && typeof atlasSpatialModel === 'object' ? atlasSpatialModel : {};
  const selected = atlas.selected === true;
  const centre = selected
    ? freeze({ id: String(atlas.centre?.id || 'atlas-project'), label: cleanSpatialLabel(atlas.centre?.label || 'Active project'), meta: cleanSpatialLabel(atlas.centre?.status || 'active'), kind: 'project', position: freeze({ x: 0, y: 0, z: 0 }) })
    : freeze({ id: 'atlas-home', label: 'Project Atlas', meta: 'Choose a project or destination', kind: 'atlas-home', position: freeze({ x: 0, y: 0, z: 0 }) });
  const sourceNodes = selected
    ? [...(atlas.nodes || []), ...(atlas.cityAnchor?.active ? [atlas.cityAnchor] : [])]
    : defaultAtlasAnchors();
  const objects = sourceNodes.slice(0, EON_NEXUS_W719_MAX_SPATIAL_OBJECTS).map((node, index) => {
    const position = node.position || projectAtlasPosition(node);
    const kind = node.id === atlas.cityAnchor?.id ? 'route' : (node.kind || node.sector || 'tool');
    return freeze({
      id: String(node.id || `atlas-node-${index}`),
      sourceId: String(node.sourceId || node.id || ''),
      kind,
      label: cleanSpatialLabel(node.label || 'Atlas node'),
      meta: cleanSpatialLabel(node.meta || node.status || node.sector || 'linked'),
      status: String(node.status || node.meta || 'available'),
      position,
      rotation: freeze({ x: 0, y: index % 2 ? 0.12 : -0.12, z: 0 }),
      scale: node.attention ? 1.18 : 1,
      selected: atlas.view?.selectedNodeId === node.id || node.selected === true,
      urgent: node.attention === true,
      compared: false,
      pickable: true,
      draggable: false,
      keyboardEquivalent: true,
      atlasNode: true,
      sourceObject: node
    });
  });
  const byId = new Map([[centre.id, centre], ...objects.map((object) => [object.id, object])]);
  const relations = selected
    ? (atlas.edges || []).filter((edge) => byId.has(edge.fromId) && byId.has(edge.toId)).map((edge) => freeze({ ...edge, from: byId.get(edge.fromId).position, to: byId.get(edge.toId).position, pickable: false }))
    : objects.map((object) => freeze({ id: `atlas-home:${object.id}`, fromId: centre.id, toId: object.id, kind: 'atlas-entry', strength: 0.62, from: centre.position, to: object.position, pickable: false }));
  return freeze({
    schema: EON_NEXUS_W719_SPATIAL_SURFACE_SCHEMA,
    surface: 'atlas',
    centre,
    objects: freeze(objects),
    relations: freeze(relations),
    camera: freeze({ alpha: -Math.PI / 2.18, beta: 1.02, radius: selected ? 8.4 : 9.2, minRadius: 5.7, maxRadius: 12.5, lowerBetaLimit: 0.68, upperBetaLimit: 1.42, target: freeze({ x: 0, y: 0.2, z: 0 }), authorityKey: `atlas:${selected ? centre.id : 'home'}:${atlas.view?.mode || 'overview'}` }),
    accent: selected ? '#f8c761' : '#22d3ee',
    secondaryAccent: '#8b5cf6',
    selected,
    empty: !selected
  });
}

export function getEonNexusW719SpatialSurfaceTruth() {
  return freeze({
    oneBabylonSceneAuthority: true,
    atlasUsesSameBoundedProjectModel: true,
    emptyAtlasUsesRealDestinationsOnly: true,
    noBabylonDependency: true,
    automaticWork: false,
    automaticNavigation: false
  });
}

export default freeze({
  EON_NEXUS_W719_SPATIAL_SURFACE_SCHEMA,
  EON_NEXUS_W719_MAX_SPATIAL_OBJECTS,
  getEonNexusW719SpatialSurface,
  getEonNexusW719SpatialSurfaceTruth
});
