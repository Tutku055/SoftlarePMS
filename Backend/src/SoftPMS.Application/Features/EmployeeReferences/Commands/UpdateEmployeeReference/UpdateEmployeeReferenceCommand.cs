using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

public record UpdateEmployeeReferenceCommand(
    Guid ReferenceId,
    UpdateEmployeeReferenceDto Dto
) : IRequest;
