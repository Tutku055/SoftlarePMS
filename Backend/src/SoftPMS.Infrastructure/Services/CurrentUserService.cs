using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.Infrastructure.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid UserId
    {
        get
        {
            var value = Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                     ?? Principal?.FindFirstValue("sub");
            return Guid.TryParse(value, out var id) ? id : Guid.Empty;
        }
    }

    /// <summary>
    /// Returns the authentic username. Extracts from the custom "username" claim or ClaimTypes.Name,
    /// explicitly avoiding email fallback to ensure strict semantic separation.
    /// </summary>
    public string Username =>
        Principal?.FindFirstValue("username")
        ?? Principal?.FindFirstValue(ClaimTypes.Name)
        ?? string.Empty;

    /// <summary>
    /// Returns the authenticated user's email address from JWT token claims.
    /// </summary>
    public string UserEmail =>
        Principal?.FindFirstValue(ClaimTypes.Email)
        ?? Principal?.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? Principal?.FindFirstValue("email")
        ?? string.Empty;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public IEnumerable<string> Permissions =>
        Principal?.Claims
            .Where(c => c.Type == "permission" || c.Type == "permissions")
            .Select(c => c.Value)
            .ToList() ?? new List<string>();

    public int TimezoneOffsetMinutes
    {
        get
        {
            if (httpContextAccessor.HttpContext != null &&
                httpContextAccessor.HttpContext.Request.Headers.TryGetValue("X-Timezone-Offset", out var headerValue) &&
                int.TryParse(headerValue, out var offset))
            {
                return offset;
            }
            return 0; // Default to UTC
        }
    }
}
