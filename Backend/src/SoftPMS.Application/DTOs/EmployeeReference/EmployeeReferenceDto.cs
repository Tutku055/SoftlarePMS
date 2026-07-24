using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.EmployeeReference;

public record EmployeeReferenceDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Company { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public ReferenceRelationship Relationship { get; init; } = ReferenceRelationship.Other;
    public string PhoneNumber { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
}