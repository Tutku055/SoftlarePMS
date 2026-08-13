using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models.Email;

namespace SoftPMS.Application.Features.Auth.Commands.ForgotPassword;

/// <summary>
/// Generates an opaque password reset token and sends an email with the reset link.
/// Returns success silently if the email is not found to prevent user enumeration.
/// </summary>
public sealed class ForgotPasswordCommandHandler(
    IApplicationDbContext context,
    IEmailService emailService,
    IDateTime dateTime,
    IConfiguration configuration,
    ILogger<ForgotPasswordCommandHandler> logger)
    : IRequestHandler<ForgotPasswordCommand>
{
    public async Task Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.Trim().ToLower();

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail && !u.IsDeleted, cancellationToken);

        // Prevent user enumeration: return silently if user does not exist or is inactive
        if (user is null || !user.IsActive)
        {
            logger.LogInformation("Password reset requested for non-existent or inactive email: {Email}", request.Email);
            return;
        }

        // Generate cryptographically secure opaque token and set 1-hour expiration
        var resetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiryTime = dateTime.UtcNow.AddHours(1);

        await context.SaveChangesAsync(cancellationToken);

        // Build reset URL pointing to frontend application
        var clientUrl = configuration["ClientUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var resetLink = $"{clientUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(user.Email)}";

        var emailBody = BuildResetEmailHtml(user.Username, resetLink);
        var emailMessage = new EmailMessage(
            to: user.Email,
            subject: "SoftPMS - Password Reset Request",
            body: emailBody,
            isHtml: true);

        try
        {
            await emailService.SendEmailAsync(emailMessage, cancellationToken);
            logger.LogInformation("Password reset email sent successfully to {Email}", user.Email);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
            // Do not fail the request to prevent enumeration or leaking internal mail delivery state
        }
    }

    private static string BuildResetEmailHtml(string username, string resetLink)
    {
        return $$"""
            <h2>Password Reset Request</h2>
            <p>Hello <strong>{{username}}</strong>,</p>
            <p>We received a request to reset your password for your SoftPMS account. Click the button below to set a new password:</p>
            <div style="text-align: center;">
                <a href="{{resetLink}}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; margin: 24px 0; text-align: center;" target="_blank">Reset Password</a>
            </div>
            <p>This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
            """;
    }
}
