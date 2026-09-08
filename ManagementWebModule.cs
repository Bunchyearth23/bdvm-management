using BDVM.Common;

namespace BDVM.Management;

public sealed class ManagementWebModule : IBdvmWebModule
{
    public BdvmWebModuleManifest Manifest { get; } = new BdvmWebModuleManifest
    {
        Id = "BDVM.Management",
        DisplayName = "BDVM - Management",
        ModuleVersion = "1.1.0",
        RequiredWebApi = new BdvmApiRange(new BdvmApiVersion(1, 0), new BdvmApiVersion(1, 0)),
        RouteNamespace = "/api/modules/bdvm.management",
        AssetNamespace = "modules/bdvm.management",
        Capabilities = new[] { "bdvm.management.dashboard.v1", "bdvm.management.fleet-naming.v1", "bdvm.management.company-governance.v1", "bdvm.management.market.v1", "bdvm.management.initial-delivery.v1" },
        Permissions = new[] { "management.read", "management.intent", "management.fleet.rename", "management.company.govern", "management.wallet.transfer", "management.market.purchase", "management.fleet.deliver" }
    };

    public void Register(IBdvmWebRegistrar registrar)
    {
        registrar.AddNavigation(new BdvmWebNavigationItem { Id = "bdvm.management.dashboard", Label = "Management", Path = "/management", Order = 200 });
        registrar.AddRoute(new BdvmWebRoute { Method = "GET", Path = "/api/modules/bdvm.management/snapshot", Permission = "management.read" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/intent", Permission = "management.intent", IntentType = "bdvm.management.intent.v1" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/fleet/rename", Permission = "management.fleet.rename", IntentType = "bdvm.management.fleet.rename.v1" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/company/governance", Permission = "management.company.govern", IntentType = "bdvm.management.company-governance.v1" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/wallet/transfer", Permission = "management.wallet.transfer", IntentType = "bdvm.management.wallet-transfer.v1" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/market/purchase", Permission = "management.market.purchase", IntentType = "bdvm.management.market.purchase.v1" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/fleet/initial-delivery", Permission = "management.fleet.deliver", IntentType = "bdvm.management.initial-delivery.v1" });
        registrar.AddAsset(new BdvmWebAsset { Key = "modules/bdvm.management/app.js", ContentType = "text/javascript" });
        registrar.AddSubscription(new BdvmRealtimeSubscription { Topic = "bdvm.management.snapshot.v1", Permission = "management.read" });
    }
}
