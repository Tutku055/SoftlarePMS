namespace SoftPMS.Application.Features.EmployeeAddresses.DTOs;

public record UpdateEmployeeAddressDto
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
