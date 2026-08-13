using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddresses;

/// <summary>
/// Represents the Query to get employee addresses.
/// </summary>
public sealed record GetEmployeeAddressesQuery(
    Guid EmployeeId,
    bool? OnlyActive = null
) : IRequest<List<EmployeeAddressDto>>;


