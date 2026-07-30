using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

public record CreateEmployeeReferenceCommand(
    Guid EmployeeId,
    CreateEmployeeReferenceDto Dto
) : IRequest<EmployeeReferenceDto>;
