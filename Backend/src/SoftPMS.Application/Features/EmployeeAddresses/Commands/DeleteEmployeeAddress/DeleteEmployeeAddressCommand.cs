using MediatR;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.DeleteEmployeeAddress;

/// <summary>
/// Represents the Command to delete employee address.
/// </summary>
public sealed record DeleteEmployeeAddressCommand(
    Guid Id,
    Guid EmployeeId
) : IRequest<Unit>;


