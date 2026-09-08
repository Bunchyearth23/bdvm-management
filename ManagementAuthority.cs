using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace BDVM.Management;

public sealed class ManagementAuthorityRequest
{
    public string Principal { get; set; } = "";
    public string IntentType { get; set; } = "";
    public string CorrelationId { get; set; } = "";
    public string IdempotencyKey { get; set; } = "";
    public long ExpectedVersion { get; set; }
    public IReadOnlyDictionary<string, object> Payload { get; set; } = new Dictionary<string, object>();
}

public sealed class ManagementAuthorityResult
{
    public string State { get; set; } = "Refused";
    public string Code { get; set; } = "refused";
    public long Version { get; set; }
    public IReadOnlyDictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
}

public interface IManagementAuthoritativePort
{
    ManagementWebSnapshot ReadSnapshot(string authenticatedPrincipal, string correlationId);
    ManagementAuthorityResult Execute(ManagementAuthorityRequest request);
}

public sealed class ManagementAuthorityGateway
{
    private static readonly HashSet<string> DerivedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "balance", "walletBalance", "authoritativeBalance", "currentOwner", "effectiveOwner",
        "effectivePermissions", "isLeader", "authenticatedPrincipal", "paidAmount", "effectivePrice",
        "computedTotal", "marketFactor", "resultState"
    };

    private readonly IManagementAuthoritativePort port;
    public ManagementAuthorityGateway(IManagementAuthoritativePort port) => this.port = port ?? throw new ArgumentNullException(nameof(port));

    public ManagementWebSnapshot Snapshot(string principal, string correlationId)
    {
        RequireToken(principal, nameof(principal));
        RequireToken(correlationId, nameof(correlationId));
        return port.ReadSnapshot(principal, correlationId) ?? throw new InvalidOperationException("The authoritative snapshot port returned no state.");
    }

    public ManagementAuthorityResult Execute(ManagementAuthorityRequest request)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));
        RequireToken(request.Principal, nameof(request.Principal));
        RequireToken(request.CorrelationId, nameof(request.CorrelationId));
        RequireToken(request.IdempotencyKey, nameof(request.IdempotencyKey));
        if (!ManagementIntentCatalog.All.Contains(request.IntentType, StringComparer.Ordinal)) return Refused("unknown-management-intent");
        if (request.ExpectedVersion < 0) return Refused("invalid-expected-version");
        if (ContainsDerivedField(request.Payload, 0)) return Refused("browser-derived-authority-field");
        return port.Execute(request) ?? Refused("empty-authoritative-result");
    }

    private static bool ContainsDerivedField(object? value, int depth)
    {
        if (value == null) return false;
        if (depth > 12) return true;
        if (value is IDictionary<string, object> map)
            return map.Any(x => DerivedFields.Contains(x.Key) || ContainsDerivedField(x.Value, depth + 1));
        if (value is IDictionary dictionary)
        {
            foreach (DictionaryEntry entry in dictionary)
                if (DerivedFields.Contains(Convert.ToString(entry.Key) ?? "") || ContainsDerivedField(entry.Value, depth + 1)) return true;
        }
        if (value is IEnumerable sequence && !(value is string))
            foreach (var item in sequence) if (ContainsDerivedField(item, depth + 1)) return true;
        return false;
    }

    private static void RequireToken(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 128 || value.Any(c => !(char.IsLetterOrDigit(c) || c == '.' || c == '_' || c == ':' || c == '-')))
            throw new ArgumentException("A bounded token is required.", name);
    }

    private static ManagementAuthorityResult Refused(string code) => new ManagementAuthorityResult { State = "Refused", Code = code };
}

public static class ManagementIntentCatalog
{
    public static readonly IReadOnlyList<string> All = new[]
    {
        "bdvm.management.intent.v1",
        "bdvm.management.company-governance.v1", "bdvm.management.company-dissolve.v1",
        "bdvm.management.wallet-transfer.v1",
        "bdvm.management.fleet-manage.v1", "bdvm.management.fleet.rename.v1", "bdvm.management.fleet-bundle.v1",
        "bdvm.management.fleet-resale.v1", "bdvm.management.fleet-maintenance.v1",
        "bdvm.management.market.purchase.v1", "bdvm.management.initial-delivery.v1",
        "bdvm.management.lease-manage.v1", "bdvm.management.assignment-manage.v1",
        "bdvm.management.finance-manage.v1", "bdvm.management.yard-manage.v1", "bdvm.management.industry-manage.v1"
    };
}
