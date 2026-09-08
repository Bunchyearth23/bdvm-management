using System;
using System.Collections.Generic;
using BDVM.Management;

internal static class Program
{
    private static int checks;
    private static int Main()
    {
        var port = new Port(); var gateway = new ManagementAuthorityGateway(port);
        var request = Request("bdvm.management.wallet-transfer.v1", new Dictionary<string, object> { ["amount"] = 100L, ["toCompany"] = true });
        Check(gateway.Execute(request).State == "Succeeded" && port.Calls == 1, "a declared intent reaches the authoritative port");
        request = Request("bdvm.management.wallet-transfer.v1", new Dictionary<string, object> { ["amount"] = 100L, ["balance"] = 999999L });
        Check(gateway.Execute(request).Code == "browser-derived-authority-field" && port.Calls == 1, "browser-provided balance is refused");
        request = Request("bdvm.management.fleet-manage.v1", new Dictionary<string, object> { ["assetId"] = "asset-1", ["nested"] = new Dictionary<string, object> { ["effectiveOwner"] = "attacker" } });
        Check(gateway.Execute(request).Code == "browser-derived-authority-field", "nested ownership claims are refused");
        Check(gateway.Execute(Request("bdvm.management.unknown.v1", new Dictionary<string, object>())).Code == "unknown-management-intent", "unknown intent is refused");
        var snapshot = gateway.Snapshot("player-a", "snapshot-1");
        Check(snapshot.CorrelationId == "snapshot-1" && snapshot.Version == 7, "snapshot comes from the authoritative port");
        Console.WriteLine("BDVM.Management authority tests: " + checks + "/" + checks + " passed"); return 0;
    }

    private static ManagementAuthorityRequest Request(string intent, IReadOnlyDictionary<string, object> payload) => new ManagementAuthorityRequest
    { Principal = "player-a", IntentType = intent, CorrelationId = "correlation-1", IdempotencyKey = Guid.NewGuid().ToString("N"), ExpectedVersion = 7, Payload = payload };
    private static void Check(bool condition, string message) { if (!condition) throw new InvalidOperationException(message); checks++; }
    private sealed class Port : IManagementAuthoritativePort
    {
        public int Calls { get; private set; }
        public ManagementWebSnapshot ReadSnapshot(string authenticatedPrincipal, string correlationId) => new ManagementWebSnapshot { Version = 7, CorrelationId = correlationId };
        public ManagementAuthorityResult Execute(ManagementAuthorityRequest request) { Calls++; return new ManagementAuthorityResult { State = "Succeeded", Code = "accepted", Version = 8 }; }
    }
}
