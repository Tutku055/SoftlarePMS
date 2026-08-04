using MediatR;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressById;

public sealed record GetEmployeeAddressByIdQuery(
    Guid Id,
    Guid EmployeeId
) : IRequest<EmployeeAddressDto>;
