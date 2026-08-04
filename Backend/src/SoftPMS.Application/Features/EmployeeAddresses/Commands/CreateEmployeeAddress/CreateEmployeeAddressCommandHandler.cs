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

        var today = dateTime.UtcNow.Date;
        var effectiveStartDate = request.Dto.StartDate <= new DateTime(1970, 1, 1) ? today : request.Dto.StartDate.Date;
        var isNewAddressActive = request.Dto.EndDate == null || request.Dto.EndDate.Value.Date >= today;

        if (isNewAddressActive)
        {
            var targetEndDate = effectiveStartDate <= today ? today.AddDays(-1) : effectiveStartDate.AddDays(-1);

            if (request.Dto.IsPrimary)
            {
                // Auto-close any existing active Primary address
                var activePrimaryAddresses = await context.EmployeeAddresses
                    .Where(a => a.EmployeeId == request.EmployeeId && a.IsPrimary && (a.EndDate == null || a.EndDate >= today))
                    .ToListAsync(cancellationToken);

                foreach (var activePrimary in activePrimaryAddresses)
                {
                    activePrimary.EndDate = targetEndDate;
                    if (activePrimary.StartDate.Date > targetEndDate)
                    {
                        activePrimary.StartDate = targetEndDate;
                    }

                    context.EmployeeAddresses.Update(activePrimary);
                }
            }
            else
            {
                // Auto-close any existing active Secondary address
                var activeSecondaryAddresses = await context.EmployeeAddresses
                    .Where(a => a.EmployeeId == request.EmployeeId && !a.IsPrimary && (a.EndDate == null || a.EndDate >= today))
                    .ToListAsync(cancellationToken);

                foreach (var activeSecondary in activeSecondaryAddresses)
                {
                    activeSecondary.EndDate = targetEndDate;
                    if (activeSecondary.StartDate.Date > targetEndDate)
                    {
                        activeSecondary.StartDate = targetEndDate;
                    }

                    context.EmployeeAddresses.Update(activeSecondary);
                }
            }
        }

        var address = mapper.Map<EmployeeAddress>(request.Dto);
        address.EmployeeId = request.EmployeeId;
        address.IsPrimary = request.Dto.IsPrimary;
        address.StartDate = effectiveStartDate;
        address.CreatedAt = dateTime.UtcNow;

        if (address.EndDate.HasValue && address.StartDate.Date > address.EndDate.Value.Date)
        {
            address.StartDate = address.EndDate.Value;
        }

        await context.EmployeeAddresses.AddAsync(address, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeAddressDto>(address);
    }
}
