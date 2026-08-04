using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.UpdateEmployeeAddress;

public sealed record UpdateEmployeeAddressCommand(
    Guid Id,
    Guid EmployeeId,
    UpdateEmployeeAddressDto Dto
) : IRequest<EmployeeAddressDto>;
