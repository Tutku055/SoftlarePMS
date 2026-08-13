using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.CreateEmployeeAddress;

/// <summary>
/// Represents the Command to create employee address.
/// </summary>
public sealed record CreateEmployeeAddressCommand(
    Guid EmployeeId,
    CreateEmployeeAddressDto Dto
) : IRequest<EmployeeAddressDto>;


