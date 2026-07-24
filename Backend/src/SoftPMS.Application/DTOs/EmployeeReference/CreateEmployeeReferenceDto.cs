using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.DTOs.EmployeeReference;

public record CreateEmployeeReferenceDto(
    string FullName,
    string Company,
    string Title,
    ReferenceRelationship Relationship,
    string PhoneNumber,
    string Email,
    string Notes
);