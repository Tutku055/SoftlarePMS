using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UpdateSystemParameters;

public record UpdateSystemParametersCommand : IRequest<SystemParametersDto>
{
    public string CompanyName { get; init; } = string.Empty;
    public string EmployeeNoPrefix { get; init; } = "EMP";
    public int GoLiveYear { get; init; }
    public decimal MonthlyWorkingHours { get; init; }
    public decimal DailyWorkingHours { get; init; }
    public string SmtpHost { get; init; } = "localhost";
    public int SmtpPort { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string SenderEmail { get; init; } = string.Empty;
    public string SmtpUserName { get; init; } = string.Empty;
    public string SmtpPassword { get; init; } = string.Empty;
    public bool SmtpEnableSsl { get; init; }
}
