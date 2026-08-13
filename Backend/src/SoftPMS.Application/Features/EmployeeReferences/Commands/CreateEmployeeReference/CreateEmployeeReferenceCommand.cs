using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

/// <summary>
/// Represents the Command to create employee reference.
/// </summary>
public record CreateEmployeeReferenceCommand(
    Guid EmployeeId,
    CreateEmployeeReferenceDto Dto
) : IRequest<EmployeeReferenceDto>;


