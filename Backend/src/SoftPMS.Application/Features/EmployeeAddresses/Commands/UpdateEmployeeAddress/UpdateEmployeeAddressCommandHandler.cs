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
    IMapper mapper)
    : IRequestHandler<UpdateEmployeeAddressCommand, EmployeeAddressDto>
{
    public async Task<EmployeeAddressDto> Handle(UpdateEmployeeAddressCommand request, CancellationToken cancellationToken)
    {
        var address = await context.EmployeeAddresses
            .FirstOrDefaultAsync(a => a.Id == request.Id && a.EmployeeId == request.EmployeeId, cancellationToken);

        if (address is null)
            throw new NotFoundException(nameof(EmployeeAddress), request.Id);

        if (request.Dto.IsPrimary && !address.IsPrimary)
        {
            var otherActivePrimaryAddresses = await context.EmployeeAddresses
                .Where(a => a.EmployeeId == request.EmployeeId && a.Id != request.Id && a.IsPrimary && a.EndDate == null)
                .ToListAsync(cancellationToken);

            foreach (var other in otherActivePrimaryAddresses)
            {
                if (other.StartDate.Date < request.Dto.StartDate.Date)
                {
                    other.EndDate = request.Dto.StartDate.Date.AddDays(-1);
                }
                other.IsPrimary = false;
                context.EmployeeAddresses.Update(other);
            }
        }

        address.AddressLine = request.Dto.AddressLine;
        address.City        = request.Dto.City;
        address.State       = request.Dto.State;
        address.Country     = request.Dto.Country;
        address.PostalCode  = request.Dto.PostalCode;
        address.IsPrimary   = request.Dto.IsPrimary;
        address.StartDate   = request.Dto.StartDate;
        address.EndDate     = request.Dto.EndDate;

        context.EmployeeAddresses.Update(address);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<EmployeeAddressDto>(address);
    }
}
