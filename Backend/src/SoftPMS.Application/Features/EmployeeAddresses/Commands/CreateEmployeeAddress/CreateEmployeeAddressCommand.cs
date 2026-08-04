using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.CreateEmployeeAddress;

public sealed record CreateEmployeeAddressCommand(
    Guid EmployeeId,
    CreateEmployeeAddressDto Dto
) : IRequest<EmployeeAddressDto>;
