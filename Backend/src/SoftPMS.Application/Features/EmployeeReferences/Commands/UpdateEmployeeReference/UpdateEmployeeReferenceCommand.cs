using MediatR;
using SoftPMS.Application.DTOs.EmployeeReference;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.UpdateEmployeeReference;

public record UpdateEmployeeReferenceCommand(
    Guid ReferenceId,
    UpdateEmployeeReferenceDto Dto
) : IRequest;
