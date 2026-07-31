using MediatR;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation;

public record DeleteEmployeeCompensationCommand(Guid Id) : IRequest<Unit>;
