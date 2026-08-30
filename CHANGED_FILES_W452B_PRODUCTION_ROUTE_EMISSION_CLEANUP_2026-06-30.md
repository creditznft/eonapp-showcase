# W452.2 Changed Files — Production Route-Emission Cleanup

## Purpose

Turn the legacy-route audit into a broad, repeatable active-source guard. The
central route contract may retain carefully declared `301` aliases for existing
bookmarks. Current HTML and active reachable JavaScript must not emit those
aliases as new foreground destinations.

## Coverage

- `/chat` → `/`
- `/trade` → `/insights`
- old City/Realm/Game aliases → `/eoncity`
- old Marketplace alias → `/market`
- old Workbench/EON Browser aliases → `/workspace`

## Boundary

The gate scans current route documents and the active import graph for literal
foreground navigation emissions. It intentionally excludes central redirect
configuration and inbound parsing compatibility. It does not claim deployed
edge, browser-history, cache, service-worker or device evidence.
