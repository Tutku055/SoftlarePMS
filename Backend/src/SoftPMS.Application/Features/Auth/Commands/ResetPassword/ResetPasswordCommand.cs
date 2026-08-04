using MediatR;

namespace SoftPMS.Application.Features.Auth.Commands.ResetPassword;

/// <summary>Command to reset a user's password using a valid reset token.</summary>
public sealed record ResetPasswordCommand(
    string Email,
    string Token,
    string NewPassword
) : IRequest;
