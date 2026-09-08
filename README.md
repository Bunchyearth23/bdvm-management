# BDVM - Management

`BDVM.Management` is the economic-management feature for the BDVM web platform. It exposes a dashboard contract for personal wallets, companies, permissions, fleet and economic actions without moving business authority into the browser.

## Status

| Property | Value |
| --- | --- |
| Module kind | Web feature |
| Target framework | .NET Framework 4.8 (`net48`) |
| Build dependency | `BDVM.Common` |
| Runtime platform | Compatible `BDVM.Web` host |
| Standalone | No |

## Responsibilities

- Register the Management navigation entry and namespaced frontend asset.
- Register `GET /api/modules/bdvm.management/snapshot` for authorized read models.
- Register `POST /api/modules/bdvm.management/intent` for authenticated user intentions.
- Register `POST /api/modules/bdvm.management/fleet/rename` for an explicit, versioned fleet-name intent.
- Register explicit company-governance, wallet-transfer, market-purchase and one-shot initial-delivery intents.
- Declare `management.read` and `management.intent` permissions explicitly.
- Subscribe to the management realtime topic and publish the `bdvm.management.dashboard.v1` capability.
- Keep the frontend contract stable while company, fleet and market services evolve behind it.

## Key surface

`ManagementWebModule` implements `IBdvmWebModule`. Its manifest and registration code are intentionally small: transport adapters provide snapshot readers and intent handlers, while authoritative domain services perform validation and mutation.

## Boundaries

This module does not calculate balances, transfer money, assign permissions, buy vehicles or change ownership. A browser request is only an intent until the authoritative host accepts it. It is not a web server and does not bundle the BDVM Web platform.

## Dependencies

The source project references `BDVM.Common`, which contains the web contracts. Its manifest declares the compatible `BDVM.Web` host as a runtime dependency. The feature services represented by the dashboard will be composed explicitly during the packaging milestone.

Fleet names are BDVM data, keyed by the persistent `AssetId`, limited to 48 characters and validated by the authoritative Fleet service. A company-owned asset can be renamed only by its leader or a member holding `ManageFleet`. The visible number painted by Number Manager remains an optional projection and is never used as identity or authority.

Catalog purchases create owned virtual stock first. Physical delivery is a distinct host-authoritative intent, free exactly once, restricted to configured depot or service tracks, and committed only when the complete component set is confirmed. Company governance and wallet-transfer intents use the same authenticated host boundary and never calculate permissions in the frontend. Company creation starts at zero, and personal/company transfers mirror the authoritative vanilla wallet with compensation on refusal.

External dependencies: none. Management does not depend directly on Remote Dispatch Live; transport belongs to Web/Dispatch composition.

## Build

With `BDVM.Common` beside this repository under `src/`:

```powershell
dotnet build .\BDVM.Management.csproj -c Release
```

## Testing and installation

The web-host validation suite checks the module manifest, route namespace, permissions, assets and capability publication. There is currently no independent Management package or browser server. Use the matching `BDVM.Full` composition for integration testing.

## Compatibility

The module targets BDVM Web API 1.0. Consumers should treat route names, permission identifiers, realtime topics and capability IDs as versioned public contracts. Unknown intents must be refused by the host.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
