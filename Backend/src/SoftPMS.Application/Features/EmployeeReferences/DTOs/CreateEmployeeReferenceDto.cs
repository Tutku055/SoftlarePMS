using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.EmployeeReferences.DTOs;

public record CreateEmployeeReferenceDto(
    string FullName,
    string Company,
    string Title,
    ReferenceRelationship Relationship,
    string PhoneNumber,
    string Email,
    string Notes
);
