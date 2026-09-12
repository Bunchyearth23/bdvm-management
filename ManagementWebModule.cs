using BDVM.Common;

namespace BDVM.Management;

public sealed class ManagementWebModule : IBdvmWebModule
{
    public BdvmWebModuleManifest Manifest { get; } = new BdvmWebModuleManifest
    {
        Id = "BDVM.Management",
        DisplayName = "BDVM - Management",
        ModuleVersion = "1.4.0",
        RequiredWebApi = new BdvmApiRange(new BdvmApiVersion(1, 0), new BdvmApiVersion(1, 0)),
        RouteNamespace = "/api/modules/bdvm.management",
        AssetNamespace = "modules/bdvm.management",
        Capabilities = new[]
        {
            "bdvm.management.dashboard.v1", "bdvm.management.companies.v1", "bdvm.management.wallets.v1",
            "bdvm.management.fleet.v1", "bdvm.management.fleet-naming.v1", "bdvm.management.market.v1",
            "bdvm.management.assignments.v1", "bdvm.management.financing.v1",
            "bdvm.management.yard-plans.v1", "bdvm.management.industry.v1", "bdvm.management.logs.v1",
            "bdvm.management.contracts.v1", "bdvm.management.passengers.v1", "bdvm.management.maintenance.v1", "bdvm.management.diagnostics.v1"
        },
        Permissions = new[]
        {
            "management.read", "management.intent", "management.company.govern", "management.wallet.transfer",
            "management.fleet.manage", "management.fleet.rename", "management.market.purchase", "management.fleet.deliver",
            "management.assignment.manage", "management.finance.manage", "management.yard.manage",
            "management.industry.manage", "management.logs.export"
        }
    };

    public void Register(IBdvmWebRegistrar registrar)
    {
        registrar.AddNavigation(new BdvmWebNavigationItem { Id = "bdvm.management.dashboard", Label = "Management", Path = "/management", Order = 200 });
        registrar.AddRoute(Get("snapshot", "management.read"));
        registrar.AddRoute(Get("logs/export", "management.logs.export"));
        registrar.AddRoute(Post("intent", "management.intent", "intent.v1"));
        registrar.AddRoute(Post("company/governance", "management.company.govern", "company-governance.v1"));
        registrar.AddRoute(Post("company/dissolve", "management.company.govern", "company-dissolve.v1"));
        registrar.AddRoute(Post("wallet/transfer", "management.wallet.transfer", "wallet-transfer.v1"));
        registrar.AddRoute(Post("fleet/manage", "management.fleet.manage", "fleet-manage.v1"));
        registrar.AddRoute(Post("fleet/rename", "management.fleet.rename", "fleet.rename.v1"));
        registrar.AddRoute(Post("fleet/bundle", "management.fleet.manage", "fleet-bundle.v1"));
        registrar.AddRoute(Post("fleet/resale", "management.fleet.manage", "fleet-resale.v1"));
        registrar.AddRoute(Post("fleet/maintenance", "management.fleet.manage", "fleet-maintenance.v1"));
        registrar.AddRoute(Post("market/purchase", "management.market.purchase", "market.purchase.v1"));
        registrar.AddRoute(Post("fleet/initial-delivery", "management.fleet.deliver", "initial-delivery.v1"));
        registrar.AddRoute(Post("assignment/manage", "management.assignment.manage", "assignment-manage.v1"));
        registrar.AddRoute(Post("finance/manage", "management.finance.manage", "finance-manage.v1"));
        registrar.AddRoute(Post("yard/manage", "management.yard.manage", "yard-manage.v1"));
        registrar.AddRoute(Post("industry/manage", "management.industry.manage", "industry-manage.v1"));
        registrar.AddAsset(new BdvmWebAsset { Key = "modules/bdvm.management/app.js", ContentType = "text/javascript" });
        registrar.AddAsset(new BdvmWebAsset { Key = "modules/bdvm.management/app.css", ContentType = "text/css" });
        registrar.AddSubscription(new BdvmRealtimeSubscription { Topic = "bdvm.management.snapshot.v1", Permission = "management.read" });
        registrar.AddSubscription(new BdvmRealtimeSubscription { Topic = "bdvm.management.intent-result.v1", Permission = "management.read" });
    }

    private static BdvmWebRoute Get(string path, string permission) => new BdvmWebRoute { Method = "GET", Path = "/api/modules/bdvm.management/" + path, Permission = permission };
    private static BdvmWebRoute Post(string path, string permission, string intent) => new BdvmWebRoute { Method = "POST", Path = "/api/modules/bdvm.management/" + path, Permission = permission, IntentType = "bdvm.management." + intent };
}
