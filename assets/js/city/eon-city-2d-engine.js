/** W221/W255 — geometry and interaction rules for the lightweight 2D City. */

import { CITY_LANDMARKS, toCityDistrict } from './city-landmark-registry.js';

export const CITY_CANVAS_SIZE = Object.freeze({ width: 1200, height: 760 });

export const CITY_DISTRICTS = Object.freeze(CITY_LANDMARKS.map(toCityDistrict));

export const CITY_COLLIDERS = Object.freeze([
  { x: 0.43, y: 0.08, width: 0.14, height: 0.3, label: 'canal' },
  { x: 0.36, y: 0.42, width: 0.28, height: 0.14, label: 'plaza garden' },
  { x: 0.44, y: 0.87, width: 0.12, height: 0.06, label: 'entry planters' }
]);

export const CITY_BOUNDS = Object.freeze({ minX: 0.03, maxX: 0.97, minY: 0.05, maxY: 0.95 });

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function inRect(point, rect, padding = 0) {
  return point.x >= rect.x - padding
    && point.x <= rect.x + rect.width + padding
    && point.y >= rect.y - padding
    && point.y <= rect.y + rect.height + padding;
}

export function cityPointIsWalkable(point) {
  const safe = {
    x: clamp(point?.x, CITY_BOUNDS.minX, CITY_BOUNDS.maxX),
    y: clamp(point?.y, CITY_BOUNDS.minY, CITY_BOUNDS.maxY)
  };
  return !CITY_COLLIDERS.some((collider) => inRect(safe, collider, 0.012));
}

export function resolveCityMovement(position, delta = {}) {
  const current = {
    x: clamp(position?.x, CITY_BOUNDS.minX, CITY_BOUNDS.maxX),
    y: clamp(position?.y, CITY_BOUNDS.minY, CITY_BOUNDS.maxY)
  };
  const requested = {
    x: clamp(current.x + Number(delta.x || 0), CITY_BOUNDS.minX, CITY_BOUNDS.maxX),
    y: clamp(current.y + Number(delta.y || 0), CITY_BOUNDS.minY, CITY_BOUNDS.maxY)
  };
  const xFirst = { x: requested.x, y: current.y };
  const yFirst = { x: current.x, y: requested.y };
  const result = { ...current };
  if (cityPointIsWalkable(xFirst)) result.x = xFirst.x;
  if (cityPointIsWalkable({ x: result.x, y: requested.y })) result.y = requested.y;
  if (result.x === current.x && result.y === current.y && cityPointIsWalkable(yFirst)) {
    result.y = yFirst.y;
    if (cityPointIsWalkable({ x: requested.x, y: result.y })) result.x = requested.x;
  }
  return result;
}

export function getCityDistrictAt(point, padding = 0) {
  return CITY_DISTRICTS.find((district) => inRect(point, district, padding)) || null;
}

export function getNearbyCityDistrict(point, radius = 0.085) {
  const inside = getCityDistrictAt(point, 0.018);
  if (inside) return inside;
  let winner = null;
  let best = Number.POSITIVE_INFINITY;
  for (const district of CITY_DISTRICTS) {
    const center = { x: district.x + district.width / 2, y: district.y + district.height / 2 };
    const distance = Math.hypot(point.x - center.x, point.y - center.y);
    if (distance < best) {
      best = distance;
      winner = district;
    }
  }
  return best <= radius ? winner : null;
}


function gridPoint(column, row, columns, rows) {
  return {
    x: CITY_BOUNDS.minX + ((column + 0.5) / columns) * (CITY_BOUNDS.maxX - CITY_BOUNDS.minX),
    y: CITY_BOUNDS.minY + ((row + 0.5) / rows) * (CITY_BOUNDS.maxY - CITY_BOUNDS.minY)
  };
}

function nearestWalkableGridCell(point, columns, rows) {
  const desiredColumn = Math.min(columns - 1, Math.max(0, Math.floor(((point.x - CITY_BOUNDS.minX) / (CITY_BOUNDS.maxX - CITY_BOUNDS.minX)) * columns)));
  const desiredRow = Math.min(rows - 1, Math.max(0, Math.floor(((point.y - CITY_BOUNDS.minY) / (CITY_BOUNDS.maxY - CITY_BOUNDS.minY)) * rows)));
  const candidates = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const pointAtCell = gridPoint(column, row, columns, rows);
      if (!cityPointIsWalkable(pointAtCell)) continue;
      candidates.push({ column, row, distance: Math.abs(column - desiredColumn) + Math.abs(row - desiredRow) });
    }
  }
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0] || null;
}

/**
 * A tiny deterministic grid pathfinder for tap-to-walk guidance. The City remains
 * fully client-side; it does not ask a server for movement or activity state.
 */
export function findCityWalkPath(start, destination, { columns = 28, rows = 18 } = {}) {
  const safeColumns = Math.max(12, Math.min(48, Math.floor(columns)));
  const safeRows = Math.max(10, Math.min(32, Math.floor(rows)));
  const startCell = nearestWalkableGridCell(start, safeColumns, safeRows);
  const goalCell = nearestWalkableGridCell(destination, safeColumns, safeRows);
  if (!startCell || !goalCell) return [];
  const key = (column, row) => `${column}:${row}`;
  const startKey = key(startCell.column, startCell.row);
  const goalKey = key(goalCell.column, goalCell.row);
  const queue = [startCell];
  const previous = new Map([[startKey, null]]);
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const current = queue.shift();
    const currentKey = key(current.column, current.row);
    if (currentKey === goalKey) break;
    for (const [deltaColumn, deltaRow] of directions) {
      const column = current.column + deltaColumn;
      const row = current.row + deltaRow;
      if (column < 0 || row < 0 || column >= safeColumns || row >= safeRows) continue;
      const nextKey = key(column, row);
      if (previous.has(nextKey) || !cityPointIsWalkable(gridPoint(column, row, safeColumns, safeRows))) continue;
      previous.set(nextKey, currentKey);
      queue.push({ column, row });
    }
  }
  if (!previous.has(goalKey)) return [];
  const path = [];
  let cursor = goalKey;
  while (cursor && cursor !== startKey) {
    const [column, row] = cursor.split(':').map(Number);
    path.push(gridPoint(column, row, safeColumns, safeRows));
    cursor = previous.get(cursor);
  }
  path.reverse();
  const last = path[path.length - 1];
  if (!last || Math.hypot(last.x - destination.x, last.y - destination.y) > 0.03) path.push({ x: destination.x, y: destination.y });
  return path;
}

export function cityDirectionFromDelta(delta = {}) {
  const x = Number(delta.x || 0);
  const y = Number(delta.y || 0);
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? 'left' : 'right';
  return y < 0 ? 'up' : 'down';
}

export function cityPointFromCanvasEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: 0.5, y: 0.5 };
  return {
    x: clamp((event.clientX - rect.left) / rect.width, CITY_BOUNDS.minX, CITY_BOUNDS.maxX),
    y: clamp((event.clientY - rect.top) / rect.height, CITY_BOUNDS.minY, CITY_BOUNDS.maxY)
  };
}

export const CITY_FIRST_CIRCUIT = Object.freeze([
  {
    id: 'visit-command-centre', districtId: 'command',
    title: 'First Circuit · Command',
    body: 'Reach the Command Centre and interact. EONBOT is your City guide, never a fake quest giver.'
  },
  {
    id: 'visit-workspace', districtId: 'workspace',
    title: 'First Circuit · Build Workshop',
    body: 'Follow the lit route to the Build Workshop and discover the project loop.'
  },
  {
    id: 'visit-realm-studio', districtId: 'realm',
    title: 'First Circuit · Realm Relay',
    body: 'Walk to Realm Relay and interact. Your Realm remains private and local in this phase.'
  },
  {
    id: 'return-to-command-centre', districtId: 'command',
    title: 'First Circuit · Return',
    body: 'Return to the Command Centre to finish the short City orientation loop.'
  }
]);

export function getCityObjectiveProgress(state) {
  const completed = new Set(state?.progress?.completedObjectives || []);
  const total = CITY_FIRST_CIRCUIT.length;
  const completedSteps = CITY_FIRST_CIRCUIT.filter((step) => completed.has(step.id)).length;
  return Object.freeze({
    completedSteps,
    total,
    complete: completed.has('first-circuit-complete') || completedSteps >= total,
    badgeLabel: completed.has('first-circuit-complete') ? 'First Circuit marked locally' : 'First Circuit in progress'
  });
}

export function buildCityObjective(state) {
  const completed = new Set(state?.progress?.completedObjectives || []);
  const progress = getCityObjectiveProgress(state);
  const current = CITY_FIRST_CIRCUIT.find((step) => !completed.has(step.id));
  if (current) {
    return {
      ...current,
      complete: false,
      step: progress.completedSteps + 1,
      total: progress.total,
      badgeLabel: progress.badgeLabel
    };
  }
  return {
    id: 'explore-at-your-pace',
    title: 'Your City is ready',
    body: 'The First Circuit is complete. Return to any district when it helps your work; nothing runs, earns, or purchases in the background.',
    districtId: null,
    complete: true,
    step: progress.total,
    total: progress.total,
    badgeLabel: 'First Circuit marked locally'
  };
}

export function getCityDistrictById(id) {
  return CITY_DISTRICTS.find((district) => district.id === id) || null;
}
