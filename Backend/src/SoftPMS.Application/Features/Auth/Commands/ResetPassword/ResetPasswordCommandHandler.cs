using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Auth.Commands.ResetPassword;

/// <summary>
/// Verifies the reset token, updates the user's password, and revokes all active refresh tokens.
/// </summary>
public sealed class ResetPasswordCommandHandler(
    IApplicationDbContext context,
    IDateTime dateTime)
    : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted, cancellationToken)
            ?? throw new DomainException("Invalid or expired reset token.");

        if (!user.IsActive)
            throw new DomainException("User account is inactive.");

        if (string.IsNullOrWhiteSpace(user.PasswordResetToken)
            || !string.Equals(user.PasswordResetToken, request.Token.Trim(), StringComparison.Ordinal))
            throw new DomainException("Invalid or expired reset token.");

        if (user.PasswordResetTokenExpiryTime is null || user.PasswordResetTokenExpiryTime <= dateTime.UtcNow)
            throw new DomainException("Reset token has expired.");

        // Update password hash and reset one-time token fields
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiryTime = null;
        user.RequiresPasswordChange = false;

        // Revoke all active refresh tokens to force re-authentication
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await context.SaveChangesAsync(cancellationToken);
    }
}
