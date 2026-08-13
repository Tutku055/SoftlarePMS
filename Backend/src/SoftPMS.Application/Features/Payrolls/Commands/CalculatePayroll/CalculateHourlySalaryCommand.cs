using MediatR;
using System;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

/// <summary>
/// Represents the Command to calculate hourly salary.
/// </summary>
public record CalculateHourlySalaryCommand(Guid EmployeeId, int Year, int Month, Guid CompensationId) : IRequest<Guid>;


