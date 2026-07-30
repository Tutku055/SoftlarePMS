using System.Security.Claims;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Auth.DTOs;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler(
    IApplicationDbContext context,
    IJwtTokenService jwtTokenService,
    IDateTime dateTime)
    : IRequestHandler<RefreshTokenCommand, JwtTokenResponseDto>
{
    public async Task<JwtTokenResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Step 1 — Extract principal from the expired access token (lifetime validation skipped)
        ClaimsPrincipal principal;
        try
        {
            principal = jwtTokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        }
        catch
        {
            throw new UnauthorizedException("Invalid access token.");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedException("Invalid access token claims.");

        // Step 2 — Load the user with the full permission chain (tracking enabled — no AsNoTracking)
        var user = await context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive, cancellationToken)
            ?? throw new UnauthorizedException("User not found or inactive.");

        // Step 3 — Validate the incoming refresh token against the persisted value and its expiry
        if (string.IsNullOrWhiteSpace(user.RefreshToken)
            || !string.Equals(user.RefreshToken, request.RefreshToken, StringComparison.Ordinal))
            throw new UnauthorizedException("Refresh token mismatch.");

        if (user.RefreshTokenExpiryTime is null || user.RefreshTokenExpiryTime <= dateTime.UtcNow)
            throw new UnauthorizedException("Refresh token has expired.");

        // Step 4 — Build the fresh permissions list from the eagerly-loaded graph
        var permissions = user.Role?.RolePermissions
            .Select(rp => rp.Permission.Name)
            .Distinct()
            .ToList() ?? new List<string>();

        // Step 5 — Rotate: generate new token pair and persist
        var newAccessToken = jwtTokenService.GenerateAccessToken(user, permissions);
        var newRefreshToken = jwtTokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = jwtTokenService.GetRefreshTokenExpiry(dateTime.UtcNow);

        await context.SaveChangesAsync(cancellationToken);

        return new JwtTokenResponseDto(newAccessToken, newRefreshToken);
    }
}
