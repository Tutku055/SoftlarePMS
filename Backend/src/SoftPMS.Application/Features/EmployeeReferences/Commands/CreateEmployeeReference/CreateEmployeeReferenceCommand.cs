using MediatR;
using SoftPMS.Application.DTOs.EmployeeReference;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.CreateEmployeeReference;

public record CreateEmployeeReferenceCommand(
    Guid EmployeeId,
    CreateEmployeeReferenceDto Dto
) : IRequest<EmployeeReferenceDto>;
