using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddresses;

public sealed class GetEmployeeAddressesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetEmployeeAddressesQuery, List<EmployeeAddressDto>>
{
    public async Task<List<EmployeeAddressDto>> Handle(GetEmployeeAddressesQuery request, CancellationToken cancellationToken)
    {
        var employeeExists = await context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var today = DateTime.UtcNow.Date;
        var query = context.EmployeeAddresses
            .AsNoTracking()
            .Where(a => a.EmployeeId == request.EmployeeId);

        if (request.OnlyActive.HasValue && request.OnlyActive.Value)
        {
            query = query.Where(a => a.EndDate == null || a.EndDate >= today);
        }

        return await query
            .OrderByDescending(a => a.EndDate == null || a.EndDate >= today)
            .ThenByDescending(a => a.IsPrimary)
            .ThenByDescending(a => a.StartDate)
            .ProjectTo<EmployeeAddressDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
