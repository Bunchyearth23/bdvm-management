using BDVM.Common;

namespace BDVM.Management;

public sealed class ManagementWebModule : IBdvmWebModule
{
    public BdvmWebModuleManifest Manifest { get; } = new BdvmWebModuleManifest
    {
        Id = "BDVM.Management",
        DisplayName = "BDVM - Management",
        ModuleVersion = "0.1.0",
        RequiredWebApi = new BdvmApiRange(new BdvmApiVersion(1, 0), new BdvmApiVersion(1, 0)),
        RouteNamespace = "/api/modules/bdvm.management",
        AssetNamespace = "modules/bdvm.management",
        Capabilities = new[] { "bdvm.management.dashboard.v1" },
        Permissions = new[] { "management.read", "management.intent" }
    };

    public void Register(IBdvmWebRegistrar registrar)
    {
        registrar.AddNavigation(new BdvmWebNavigationItem { Id = "bdvm.management.dashboard", Label = "Management", Path = "/management", Order = 200 });
        registrar.AddRoute(new BdvmWebRoute { Method = "GET", Path = "/api/modules/bdvm.management/snapshot", Permission = "management.read" });
        registrar.AddRoute(new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/intent", Permission = "management.intent", IntentType = "bdvm.management.intent.v1" });
        registrar.AddAsset(new BdvmWebAsset { Key = "modules/bdvm.management/app.js", ContentType = "text/javascript" });
        registrar.AddSubscription(new BdvmRealtimeSubscription { Topic = "bdvm.management.snapshot.v1", Permission = "management.read" });
    }
}
