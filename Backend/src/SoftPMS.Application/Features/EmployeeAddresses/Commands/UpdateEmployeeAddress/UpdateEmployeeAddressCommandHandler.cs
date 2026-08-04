using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.EmployeeAddresses.Commands.UpdateEmployeeAddress;

public sealed class UpdateEmployeeAddressCommandHandler(
    IApplicationDbContext context,
    IMapper mapper,
    IDateTime dateTime)
    : IRequestHandler<UpdateEmployeeAddressCommand, EmployeeAddressDto>
{
    public async Task<EmployeeAddressDto> Handle(UpdateEmployeeAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await context.EmployeeAddresses
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.EmployeeId == request.EmployeeId, cancellationToken);

        if (address is null)
            throw new NotFoundException(nameof(EmployeeAddress), request.Id);

        var today = dateTime.UtcNow.Date;
        var effectiveStartDate = request.Dto.StartDate <= new DateTime(1970, 1, 1) ? today : request.Dto.StartDate.Date;
        var isUpdatedAddressActive = request.Dto.EndDate == null || request.Dto.EndDate.Value.Date >= today;

        if (isUpdatedAddressActive)
        {
            var targetEndDate = effectiveStartDate <= today ? today.AddDays(-1) : effectiveStartDate.AddDays(-1);

            if (request.Dto.IsPrimary)
            {
                var otherActivePrimaryAddresses = await context.EmployeeAddresses
                    .Where(a => a.EmployeeId == request.EmployeeId && a.Id != request.Id && a.IsPrimary && (a.EndDate == null || a.EndDate >= today))
                    .ToListAsync(cancellationToken);

                foreach (var other in otherActivePrimaryAddresses)
                {
                    other.EndDate = targetEndDate;
                    if (other.StartDate.Date > targetEndDate)
                    {
                        other.StartDate = targetEndDate;
                    }

                    context.EmployeeAddresses.Update(other);
                }
            }
            else
            {
                var otherActiveSecondaryAddresses = await context.EmployeeAddresses
                    .Where(a => a.EmployeeId == request.EmployeeId && a.Id != request.Id && !a.IsPrimary && (a.EndDate == null || a.EndDate >= today))
                    .ToListAsync(cancellationToken);

                foreach (var other in otherActiveSecondaryAddresses)
                {
                    other.EndDate = targetEndDate;
                    if (other.StartDate.Date > targetEndDate)
                    {
                        other.StartDate = targetEndDate;
                    }

                    context.EmployeeAddresses.Update(other);
                }
            }
        }

        address.AddressLine = request.Dto.AddressLine;
        address.City        = request.Dto.City;
        address.State       = request.Dto.State;
        address.Country     = request.Dto.Country;
        address.PostalCode  = request.Dto.PostalCode;
        address.IsPrimary   = request.Dto.IsPrimary;
        address.StartDate   = effectiveStartDate;
        address.EndDate     = request.Dto.EndDate;

        if (address.EndDate.HasValue && address.StartDate.Date > address.EndDate.Value.Date)
        {
            address.StartDate = address.EndDate.Value;
        }

        context.EmployeeAddresses.Update(address);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeAddressDto>(address);
    }
}
