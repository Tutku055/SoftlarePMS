using MediatR;
using System;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public record CalculateHourlySalaryCommand(Guid EmployeeId, int Year, int Month, Guid CompensationId) : IRequest<Guid>;
