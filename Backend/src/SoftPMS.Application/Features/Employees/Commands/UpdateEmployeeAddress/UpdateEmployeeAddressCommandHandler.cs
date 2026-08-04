using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Employees.Commands.UpdateEmployeeAddress;

/// <summary>
/// Updates an employee's address.
/// </summary>
public sealed class UpdateEmployeeAddressCommandHandler(
    IApplicationDbContext context,
    IDateTime dateTime)
    : IRequestHandler<UpdateEmployeeAddressCommand, Unit>
{
    public async Task<Unit> Handle(UpdateEmployeeAddressCommand request, CancellationToken cancellationToken)
    {
        // Verify the employee exists (respects the global IsDeleted filter)
        var employeeExists = await context.Employees
            .AnyAsync(e => e.Id == request.EmployeeId, cancellationToken);

        if (!employeeExists)
            throw new NotFoundException(nameof(Employee), request.EmployeeId);

        // Find the employee's existing address (latest primary/active or latest added)
        var today = dateTime.UtcNow.Date;
        var address = await context.EmployeeAddresses
            .OrderByDescending(a => a.EndDate == null || a.EndDate >= today)
            .ThenByDescending(a => a.IsPrimary)
            .ThenByDescending(a => a.StartDate)
            .FirstOrDefaultAsync(
                a => a.EmployeeId == request.EmployeeId,
                cancellationToken);

        if (address is not null)
        {
            address.AddressLine = request.AddressLine;
            address.PostalCode  = request.PostalCode;
            address.City        = request.City;
            address.State       = request.State;
            address.Country     = request.Country;
            address.IsPrimary   = request.IsPrimary;
        }
        else
        {
            var newAddress = new EmployeeAddress
            {
                EmployeeId  = request.EmployeeId,
                AddressLine = request.AddressLine,
                PostalCode  = request.PostalCode,
                City        = request.City,
                State       = request.State,
                Country     = request.Country,
                IsPrimary   = request.IsPrimary,
                StartDate   = dateTime.UtcNow.Date,
                CreatedAt   = dateTime.UtcNow
            };
            await context.EmployeeAddresses.AddAsync(newAddress, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
