using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.EmployeeReference;

public record UpdateEmployeeReferenceDto(
    string FullName,
    string Company,
    string Title,
    ReferenceRelationship Relationship,
    string PhoneNumber,
    string Email,
    string Notes
);
