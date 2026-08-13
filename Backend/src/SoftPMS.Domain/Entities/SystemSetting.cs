using System.ComponentModel.DataAnnotations;

namespace SoftPMS.Domain.Entities;

public class SystemSetting : BaseEntity
{
    // Company Profile
    [MaxLength(200)]
    public string? CompanyName { get; set; }
    
    [MaxLength(500)]
    public string? CompanyLogoPath { get; set; }

    // General & Employee Settings
    [MaxLength(20)]
    public string EmployeeNoPrefix { get; set; } = "EMP";
    
    public int GoLiveYear { get; set; } = 2026;

    // Payroll & Working Hours
    public decimal MonthlyWorkingHours { get; set; } = 225m;
    
    public decimal DailyWorkingHours { get; set; } = 8m;

    // Email (SMTP) Configuration
    [MaxLength(200)]
    public string SmtpHost { get; set; } = "localhost";
    
    public int SmtpPort { get; set; } = 1025;
    
    [MaxLength(200)]
    public string SenderName { get; set; } = "SoftPMS";
    
    [MaxLength(200)]
    public string SenderEmail { get; set; } = "no-reply@softpms.com";
    
    [MaxLength(200)]
    public string? SmtpUserName { get; set; }
    
    [MaxLength(200)]
    public string? SmtpPassword { get; set; }
    
    public bool SmtpEnableSsl { get; set; } = false;
}
