# W380 — Product Reset Foundation

## Purpose

Move EONAPP from an explanation-heavy workspace shell to a guest-first AI creation workspace without deleting local data, Vault boundaries, existing project state, or City state.

## Decisions implemented in this wave

- Root `https://eonapp.ch/` becomes the EONBOT home surface; legacy `/chat` and `/chat.html` converge to the root URL.
- Public theme choices are dark-only: Graphite, Obsidian, Neon Night.
- Graphite is the default and older Classic EON/System preferences safely migrate to Graphite.
- Root chat hides runtime and mission control panels until the user explicitly opens **AI setup**.
- The current source does not claim file upload, GitHub sync, ecommerce, on-chain ownership, or usable collectible utility before those flows exist.

## Collectibles decision

EON Studio / Collection work is deferred until W390/W391. The visual generator remains a private local preview engine in this foundation wave. No user-facing **NFT**, **Marketplace**, **Store**, sale, payment, or utility-unlock claim is added here.

Future implementation must use this order:

1. Studio creates a usable visual asset.
2. Library stores the asset.
3. A Collection item may represent an optional enhancement pass only after a clear entitlement record exists.
4. Storefront/payment work remains disabled until payment, receipt, refund, tax, entitlement and support proof are all live.

## Data boundary

No W380 migration deletes or rewrites local Chat, Vault, Projects, Library, City or existing market-preview keys. Theme migration changes only the UI preference value.

## Next coding waves

- W382 root EONBOT interaction simplification
- W384 sidebar/navigation rebuild (the first compact shell is included in this foundation snapshot)
- W385 EON Forge Quick Build foundation
- W390 Studio and W391 Collection only after the user confirms the item-to-utility model
