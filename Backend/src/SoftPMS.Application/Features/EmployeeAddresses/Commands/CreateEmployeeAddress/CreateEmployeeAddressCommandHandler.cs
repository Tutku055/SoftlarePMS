using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.CreateEmployeeAddress;

public sealed class CreateEmployeeAddressCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    IDateTime dateTime)
    : IRequestHandler<CreateEmployeeAddressCommand, EmployeeAddressDto>
{
    public async Task<EmployeeAddressDto> Handle(CreateEmployeeAddressCommand request, CancellationToken cancellationToken)
    {
        var employeeExists = await context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        var hasAnyAddress = await context.EmployeeAddresses
            .AnyAsync(a => a.EmployeeId == request.EmployeeId, cancellationToken);

        var isPrimary = request.Dto.IsPrimary || !hasAnyAddress;

        if (isPrimary)
        {
            var activePrimaryAddresses = await context.EmployeeAddresses
                .Where(a => a.EmployeeId == request.EmployeeId && a.IsPrimary && a.EndDate == null)
                .ToListAsync(cancellationToken);

            foreach (var activePrimary in activePrimaryAddresses)
            {
                if (activePrimary.StartDate.Date < request.Dto.StartDate.Date)
                {
                    activePrimary.EndDate = request.Dto.StartDate.Date.AddDays(-1);
                }
                activePrimary.IsPrimary = false;
                context.EmployeeAddresses.Update(activePrimary);
            }
        }

        var address = mapper.Map<EmployeeAddress>(request.Dto);
        address.EmployeeId = request.EmployeeId;
        address.IsPrimary = isPrimary;
        address.CreatedAt = dateTime.UtcNow;

        await context.EmployeeAddresses.AddAsync(address, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeAddressDto>(address);
    }
}
