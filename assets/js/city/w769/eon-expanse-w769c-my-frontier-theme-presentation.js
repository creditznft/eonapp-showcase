/** W769C — canonical My Frontier-only visual material presentation for approved themes. */
import {
  EON_EXPANSE_W769B_DEFAULT_THEME_ID,
  getEonExpanseW769BTheme
} from './eon-expanse-w769b-my-frontier-theme.js';

export const EON_EXPANSE_W769C_THEME_PRESENTATION_SCHEMA = 'eon.expanse.my-frontier-theme-presentation.w769c.v1';
const freeze = Object.freeze;

const slot = (diffuse, emissive, intensity, alpha = 1) => freeze({ diffuse, emissive, intensity, alpha });

export function deriveEonExpanseW769CThemePresentation({ themeId = EON_EXPANSE_W769B_DEFAULT_THEME_ID, unlocked = false } = {}) {
  const theme = getEonExpanseW769BTheme(themeId);
  const palette = theme.palette;
  return freeze({
    schema: EON_EXPANSE_W769C_THEME_PRESENTATION_SCHEMA,
    themeId: theme.id,
    themeLabel: theme.label,
    unlocked: unlocked === true,
    materials: freeze({
      terrain: slot(palette.terrain, palette.circuit, 0.1),
      underlay: slot(palette.underlay, palette.terrain, 0.08),
      circuit: slot(palette.terrain, palette.circuit, 0.78),
      pad: slot(palette.terrain, palette.boundary, 0.18),
      boundary: slot(palette.terrain, palette.boundary, 0.42),
      marker: slot(palette.terrain, palette.marker, 0.64),
      hologram: slot(palette.terrain, palette.circuit, 0.9, 0.24),
      foundation: slot(palette.terrain, palette.foundation, 0.44),
      scaffold: slot(palette.terrain, palette.marker, 0.72)
    }),
    myFrontierMaterialsOnly: true,
    sceneEnvironmentMutated: false,
    authoredAssetMaterialsOverwritten: false,
    residentAssetMaterialsOverwritten: false,
    customShaderUsed: false,
    postProcessUsed: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW769CThemePresentation(value = null) {
  const errors = [];
  if (value?.schema !== EON_EXPANSE_W769C_THEME_PRESENTATION_SCHEMA) errors.push('schema-invalid');
  if (!value?.themeId || !value?.themeLabel) errors.push('theme-identity-missing');
  const expectedSlots = ['terrain', 'underlay', 'circuit', 'pad', 'boundary', 'marker', 'hologram', 'foundation', 'scaffold'];
  if (!expectedSlots.every((name) => value?.materials?.[name]?.diffuse && value?.materials?.[name]?.emissive)) errors.push('material-slots-incomplete');
  if (value?.myFrontierMaterialsOnly !== true || value?.sceneEnvironmentMutated !== false) errors.push('presentation-boundary-invalid');
  if (value?.authoredAssetMaterialsOverwritten !== false || value?.residentAssetMaterialsOverwritten !== false) errors.push('authored-material-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({
  EON_EXPANSE_W769C_THEME_PRESENTATION_SCHEMA,
  deriveEonExpanseW769CThemePresentation,
  validateEonExpanseW769CThemePresentation
});
