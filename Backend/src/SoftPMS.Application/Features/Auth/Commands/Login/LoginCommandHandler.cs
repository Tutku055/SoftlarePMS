using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Auth.DTOs;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Auth.Commands.Login;

/// <summary>
/// Validates credentials, generates both an access token and a refresh token,
/// persists the refresh token on the User record, and returns both to the caller.
/// </summary>
public sealed class LoginCommandHandler(
    IApplicationDbContext context,
    IJwtTokenService jwtTokenService,
    IDateTime dateTime)
    : IRequestHandler<LoginCommand, LoginResponseDto>
{
    public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var normalizedUsername = request.Username.Trim().ToLower();

        var user = await context.Users
            .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);

        if (user == null)
            throw new DomainException("Invalid credentials.");

        if (!user.IsActive)
            throw new DomainException("User is not active.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new DomainException("Invalid credentials.");

        var permissions = user.RequiresPasswordChange 
            ? new List<string> { "Users.ChangePassword", "Users.Read" }
            : user.Role?.RolePermissions
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .ToList() ?? new List<string>();

        var accessToken = jwtTokenService.GenerateAccessToken(user, permissions);
        var refreshToken = jwtTokenService.GenerateRefreshToken();

        // Persist the refresh token — tracked entity, no explicit Update() call needed
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = jwtTokenService.GetRefreshTokenExpiry(dateTime.UtcNow, request.RememberMe);

        await context.SaveChangesAsync(cancellationToken);

        // Use the service to get the correct expiry — avoids hardcoding or drift from JwtSettings
        var tokenExpiration = jwtTokenService.GetAccessTokenExpiry(dateTime.UtcNow);

        return new LoginResponseDto(accessToken, refreshToken, tokenExpiration, user.Username, user.Email, user.RequiresPasswordChange);
    }
}
