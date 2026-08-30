# W368 — EONBOT City Work Loop

## Delivered local work loop

EONBOT can now offer four short City work lanes: shape a project, research next steps, prepare a build brief, and organise a workflow. Selecting a lane creates a bounded foreground planning record through the existing local AI Kernel bridge, then requires a visible review before the user opens Chat, Workspace, Projects, or Automations.

A short typed note can be entered only as a local dock cue. The implementation retains only whether text was present and its bounded length. It does not store, render, place in a URL, transfer to the Kernel bridge, or forward the typed words. The user enters the detailed request in the native work surface after review.

## Safety boundaries

- City does not call a provider and does not call a model from this loop.
- City does not execute, schedule, publish, connect, spend, delete, or administer anything.
- The local Kernel record is a review-needed planning receipt, not proof that an agent is working in the background.
- City renderers may show only an intent label, bounded role, review state and native destination.
- Return markers contain opaque task identity, intent and landmark only. They contain no prompt, output, project file, provider metadata, Vault data, account record or payment data.

## Does not claim

This code wave does not claim automatic AI work, external integrations, workflow execution, durable cloud task storage, provider connectivity, browser/device proof, or production deployment.
