using MediatR;
using SoftPMS.Application.Common.Interfaces;

using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Commands.TestEmailConnection;

/// <summary>
/// Represents the Command to test email connection.
/// </summary>
public record TestEmailConnectionCommand : IRequest<TestEmailResultDto>
{
    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string SenderEmail { get; init; } = string.Empty;
    public string SmtpUserName { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
    public bool SmtpEnableSsl { get; init; }
}


