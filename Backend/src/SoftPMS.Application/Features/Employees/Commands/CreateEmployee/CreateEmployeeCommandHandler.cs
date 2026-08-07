using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Employees.Commands.CreateEmployee;

/// <summary>Handles employee creation: duplicate-number guard, hourly/monthly leave constraint enforcement, and initial address + compensation seeding.</summary>
public sealed class CreateEmployeeCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUser,
    IDateTime dateTime)
    : IRequestHandler<CreateEmployeeCommand, CreatedEmployeeDto>
{
    public async Task<CreatedEmployeeDto> Handle(CreateEmployeeCommand request, CancellationToken cancellationToken)
    {
        // Prevent duplicate employee numbers
        var duplicate = await context.Employees
            .AnyAsync(e => e.EmployeeNo == request.EmployeeNo, cancellationToken);

        if (duplicate)
            throw new DomainException($"An employee with number '{request.EmployeeNo}' already exists.");

        var now = dateTime.UtcNow;
        var actorId = currentUser.UserId;

        // Hourly employees have no leave entitlement; override any supplied values.
        var workingHours = request.SalaryType == Domain.Enums.SalaryType.Hourly ? 0 : request.WorkingHoursPerWeek;
        var annualVacation = request.SalaryType == Domain.Enums.SalaryType.Hourly ? 0 : request.AnnualVacationDays;
        var carriedOver = request.SalaryType == Domain.Enums.SalaryType.Hourly ? 0 : request.CarriedOverLeaves;

        var employee = new Employee
        {
            EmployeeNo        = request.EmployeeNo,
            FirstName         = request.FirstName,
            LastName          = request.LastName,
            Email             = request.Email?.Trim() ?? string.Empty,
            Gender            = request.Gender,
            DateOfBirth       = request.DateOfBirth,
            Nationality       = request.Nationality,
            ProfessionId      = request.ProfessionId,
            EmploymentStatus  = request.EmploymentStatus,
            HireDate          = request.HireDate,
            WorkingHoursPerWeek = workingHours,
            AnnualVacationDays= annualVacation,
            CarriedOverLeaves = carriedOver,
            DepartmentId      = request.DepartmentId,
            CreatedByUserId   = actorId,
            CreatedAt         = now,
            IsDeleted         = false
        };

        // Initial primary address
        var initialAddress = new EmployeeAddress
        {
            Employee    = employee,
            AddressLine = request.AddressLine,
            PostalCode  = request.PostalCode,
            City        = request.City,
            State       = request.State,
            Country     = request.Country,
            IsPrimary   = true,
            StartDate   = request.HireDate,
            EndDate     = null,
            CreatedAt   = now
        };

        // Initial compensation
        var initialCompensation = new EmployeeCompensation
        {
            Employee      = employee,
            BaseSalary    = 0,
            Currency      = Currency.TRY,
            SalaryType    = request.SalaryType,
            EffectiveDate = request.HireDate,
            CreatedAt     = now,
            CreatedByUserId = actorId
        };

        await context.Employees.AddAsync(employee, cancellationToken);
        await context.EmployeeAddresses.AddAsync(initialAddress, cancellationToken);
        await context.EmployeeCompensations.AddAsync(initialCompensation, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        return new CreatedEmployeeDto(employee.Id, employee.EmployeeNo, employee.HireDate);
    }
}
