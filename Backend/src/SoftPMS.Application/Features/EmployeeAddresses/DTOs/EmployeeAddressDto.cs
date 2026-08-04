namespace SoftPMS.Application.Features.EmployeeAddresses.DTOs;

public record EmployeeAddressDto
{
    public Guid Id { get; init; }
    public Guid EmployeeId { get; init; }
    public string AddressLine { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public bool IsPrimary { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public bool IsCurrent { get; init; }
    public DateTime CreatedAt { get; init; }
}
