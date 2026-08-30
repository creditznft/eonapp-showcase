# W660E focused EONAPP adapters — source receipt

W660E projects eight bounded, read-only product presences into the shared EON NEXUS state: Forge, Projects, Local AI, Library, Automations, Vault, Settings and Billing.

The Forge projection retains the seven approved workflow stages. Automations distinguish upcoming, successful, failed and waiting-condition records. Local AI marks private-on-device state only when the existing readiness store says the route is local. Library exposes counts/provenance only; Vault exposes secure metadata state only; Settings is a help pulse; Billing remains server-authoritative.

The adapters do not start work, run an automation, change providers or billing, read Vault contents, expose project/library labels, or own another product store. Browser and production certification remain separate.
