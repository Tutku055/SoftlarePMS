using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeAddresses.Queries.GetEmployeeAddressById;

public sealed class GetEmployeeAddressByIdQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetEmployeeAddressByIdQuery, EmployeeAddressDto>
{
    public async Task<EmployeeAddressDto> Handle(GetEmployeeAddressByIdQuery request, CancellationToken cancellationToken)
    {
        var address = await context.EmployeeAddresses
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.EmployeeId == request.EmployeeId, cancellationToken);

        if (address is null)
            throw new NotFoundException(nameof(EmployeeAddress), request.Id);

        return mapper.Map<EmployeeAddressDto>(address);
    }
}
