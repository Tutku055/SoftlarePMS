namespace SoftPMS.Application.Features.Notifications.Models;

public enum AudienceScope
{
    Single = 1,
    Multiple = 2,
    All = 3,
    Permission = 4
}

public sealed class TargetAudience
{
    public AudienceScope Scope { get; }
    public IReadOnlyList<Guid> UserIds { get; }
    public IReadOnlyList<string> RequiredPermissions { get; }

    private TargetAudience(AudienceScope scope, IReadOnlyList<Guid> userIds, IReadOnlyList<string>? requiredPermissions = null)
    {
        Scope = scope;
        UserIds = userIds;
        RequiredPermissions = requiredPermissions ?? Array.Empty<string>();
    }

    public static TargetAudience ForSingleUser(Guid userId) =>
        new(AudienceScope.Single, new[] { userId });

    public static TargetAudience ForMultipleUsers(IEnumerable<Guid> userIds) =>
        new(AudienceScope.Multiple, userIds.Distinct().ToList());

    public static TargetAudience ForAllUsers() =>
        new(AudienceScope.All, Array.Empty<Guid>());

    public static TargetAudience ForPermission(string permission) =>
        new(AudienceScope.Permission, Array.Empty<Guid>(), new[] { permission });

    public static TargetAudience ForAnyPermission(params string[] permissions) =>
        new(AudienceScope.Permission, Array.Empty<Guid>(), permissions.Distinct().ToList());

    public static TargetAudience ForAnyPermission(IEnumerable<string> permissions) =>
        new(AudienceScope.Permission, Array.Empty<Guid>(), permissions.Distinct().ToList());
}

