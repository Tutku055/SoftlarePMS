using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddresses;

public sealed record GetEmployeeAddressesQuery(
    Guid EmployeeId,
    bool? OnlyActive = null
) : IRequest<List<EmployeeAddressDto>>;
