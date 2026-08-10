namespace SoftPMS.Application.Common.Interfaces;

/// <summary>
/// Provides the identity of the currently authenticated user to the Application layer.
/// Implemented in the Presentation/Infrastructure layer using HttpContext.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>The authenticated user's Id (Guid). Returns Guid.Empty when unauthenticated.</summary>
    Guid UserId { get; }

    /// <summary>The authenticated user's username. Returns empty string when unauthenticated.</summary>
    string Username { get; }

    /// <summary>The authenticated user's email address. Returns empty string when unauthenticated.</summary>
    string UserEmail { get; }

    /// <summary>True when a valid authenticated session is present.</summary>
    bool IsAuthenticated { get; }
    IEnumerable<string> Permissions { get; }
    int TimezoneOffsetMinutes { get; }
}
