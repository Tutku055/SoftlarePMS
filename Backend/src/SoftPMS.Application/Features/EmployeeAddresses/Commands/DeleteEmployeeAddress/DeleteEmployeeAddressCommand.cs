using MediatR;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.DeleteEmployeeAddress;

public sealed record DeleteEmployeeAddressCommand(
    Guid Id,
    Guid EmployeeId
) : IRequest<Unit>;
