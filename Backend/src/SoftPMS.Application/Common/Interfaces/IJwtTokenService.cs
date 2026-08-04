using System.Security.Claims;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Common.Interfaces;

/// <summary>
/// Contract for JWT token operations. Implemented in the Infrastructure layer so that
/// cryptographic dependencies stay outside the Application layer.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>Generates a signed JWT containing UserId, Email, and per-permission claims.</summary>
    string GenerateAccessToken(User user, List<string> permissions);

    /// <summary>Generates a cryptographically random, opaque refresh token string.</summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Extracts the <see cref="ClaimsPrincipal"/> from an expired token without validating lifetime.
    /// Throws <see cref="Microsoft.IdentityModel.Tokens.SecurityTokenException"/> if the token is structurally invalid.
    /// </summary>
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
    /// <summary>
    /// Returns the absolute expiry date-time for an access token issued at <paramref name="issuedAt"/>.
    /// Allows Application-layer handlers to include the correct expiry in their response DTOs
    /// without depending on Infrastructure-level JWT configuration.
    /// </summary>
    DateTime GetAccessTokenExpiry(DateTime issuedAt);

    /// <summary>
    /// Returns the absolute expiry date-time for a refresh token issued at <paramref name="issuedAt"/>.
    /// When <paramref name="rememberMe"/> is true, a longer retention period (e.g. 30 days) is applied.
    /// </summary>
    DateTime GetRefreshTokenExpiry(DateTime issuedAt, bool rememberMe = false);
}
