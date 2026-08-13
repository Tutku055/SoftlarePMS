using MediatR;
using System;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

/// <summary>
/// Represents the Command to calculate monthly salary.
/// </summary>
public record CalculateMonthlySalaryCommand(Guid EmployeeId, int Year, int Month, Guid CompensationId) : IRequest<Guid>;


