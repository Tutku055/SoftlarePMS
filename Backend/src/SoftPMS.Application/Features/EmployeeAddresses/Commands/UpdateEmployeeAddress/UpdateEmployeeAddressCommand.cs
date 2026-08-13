using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.UpdateEmployeeAddress;

/// <summary>
/// Represents the Command to update employee address.
/// </summary>
public sealed record UpdateEmployeeAddressCommand(
    Guid Id,
    Guid EmployeeId,
    UpdateEmployeeAddressDto Dto
) : IRequest<EmployeeAddressDto>;


