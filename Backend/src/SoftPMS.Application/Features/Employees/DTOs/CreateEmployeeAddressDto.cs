namespace SoftPMS.Application.Features.Employees.DTOs;

public record CreateEmployeeAddressDto
{
    public string AddressLine { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
}
