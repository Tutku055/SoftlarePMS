namespace SoftPMS.Application.Features.Payrolls.DTOs;

/// <summary>Request body for payroll calculation (route params excluded to avoid .NET 10 OpenAPI null-metadata crash).</summary>
public class CalculatePayrollRequest
{
    public int Year { get; set; }
    /// <summary>1–12</summary>
    public int Month { get; set; }
}
