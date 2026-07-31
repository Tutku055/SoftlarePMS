using MediatR;
using System;

namespace SoftPMS.Application.Features.Payrolls.Commands.CalculatePayroll;

public record CalculatePayrollCommand(Guid EmployeeId, int Year, int Month) : IRequest<Guid>;
