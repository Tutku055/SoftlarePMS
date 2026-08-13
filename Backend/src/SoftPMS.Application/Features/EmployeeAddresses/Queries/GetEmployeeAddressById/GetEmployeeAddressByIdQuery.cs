using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressById;

/// <summary>
/// Represents the Query to get employee address by id.
/// </summary>
public sealed record GetEmployeeAddressByIdQuery(
    Guid Id,
    Guid EmployeeId
) : IRequest<EmployeeAddressDto>;



