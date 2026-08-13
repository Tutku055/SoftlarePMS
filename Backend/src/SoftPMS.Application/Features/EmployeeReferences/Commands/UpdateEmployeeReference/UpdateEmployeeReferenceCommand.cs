using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

/// <summary>
/// Represents the Command to update employee reference.
/// </summary>
public record UpdateEmployeeReferenceCommand(
    Guid ReferenceId,
    UpdateEmployeeReferenceDto Dto
) : IRequest;


