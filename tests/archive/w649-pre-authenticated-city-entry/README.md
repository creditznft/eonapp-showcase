# Archived pre-W649 City access truth test

This exact W554 test records the former `public-preview` access-mode behavior. W649B removes that product mode: signed-out `/eoncity` is now a polished static authentication portal, and the Babylon runtime, GLBs, City audio, and controls remain unloaded until the existing EONAPP identity endpoint authorizes the session.

This archive is historical and non-certifying. Current certification lives in `tests/unit/w554-city-access-project-portals.test.mjs` and `tests/unit/w649-eoncity-authenticated-entry.test.mjs`.
