using MediatR;

namespace SoftPMS.Application.Features.Auth.Commands.ForgotPassword;

/// <summary>Command to request a password reset link via email.</summary>
public sealed record ForgotPasswordCommand(
    string Email
) : IRequest;
