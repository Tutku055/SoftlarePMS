namespace SoftPMS.Application.Features.Notifications.Models;

public enum AudienceScope
{
    Single = 1,
    Multiple = 2,
    All = 3
}

public sealed class TargetAudience
{
    public AudienceScope Scope { get; }
    public IReadOnlyList<Guid> UserIds { get; }

    private TargetAudience(AudienceScope scope, IReadOnlyList<Guid> userIds)
    {
        Scope = scope;
        UserIds = userIds;
    }

    public static TargetAudience ForSingleUser(Guid userId) =>
        new(AudienceScope.Single, new[] { userId });

    public static TargetAudience ForMultipleUsers(IEnumerable<Guid> userIds) =>
        new(AudienceScope.Multiple, userIds.Distinct().ToList());

    public static TargetAudience ForAllUsers() =>
        new(AudienceScope.All, Array.Empty<Guid>());
}
