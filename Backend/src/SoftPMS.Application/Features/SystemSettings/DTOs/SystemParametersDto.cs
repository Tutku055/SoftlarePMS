namespace SoftPMS.Application.Features.SystemSettings.DTOs;

public class SystemParametersDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string CompanyLogoPath { get; set; } = string.Empty;
    public string EmployeeNoPrefix { get; set; } = "EMP";
    public int GoLiveYear { get; set; }
    public decimal MonthlyWorkingHours { get; set; }
    public decimal DailyWorkingHours { get; set; }
    public string SmtpHost { get; set; } = "localhost";
    public int SmtpPort { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderEmail { get; set; } = string.Empty;
    public string SmtpUserName { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public bool SmtpEnableSsl { get; set; }
}
