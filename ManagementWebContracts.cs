using System;
using System.Collections.Generic;

namespace BDVM.Management;

public sealed class ManagementWebSnapshot
{
    public int SchemaVersion { get; set; } = 1;
    public long Version { get; set; }
    public string CorrelationId { get; set; } = "";
    public IReadOnlyDictionary<string, bool> FeatureFlags { get; set; } = new Dictionary<string, bool>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Companies { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Wallets { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Fleet { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Market { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Leases { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Assignments { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Financing { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> YardPlans { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Industry { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Contracts { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Passengers { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Maintenance { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<IReadOnlyDictionary<string, object>> Diagnostics { get; set; } = Array.Empty<IReadOnlyDictionary<string, object>>();
    public IReadOnlyList<ManagementActionDescriptor> Actions { get; set; } = Array.Empty<ManagementActionDescriptor>();
}

public sealed class ManagementActionDescriptor
{
    public string Area { get; set; } = "";
    public string Label { get; set; } = "";
    public string IntentType { get; set; } = "";
    public IReadOnlyDictionary<string, object> Payload { get; set; } = new Dictionary<string, object>();
    public string Confirmation { get; set; } = "";
}
