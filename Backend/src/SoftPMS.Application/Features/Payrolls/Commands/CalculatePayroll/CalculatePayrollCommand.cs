using MediatR;
using System;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

/// <summary>
/// Represents the Command to calculate payroll.
/// </summary>
public record CalculatePayrollCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;


