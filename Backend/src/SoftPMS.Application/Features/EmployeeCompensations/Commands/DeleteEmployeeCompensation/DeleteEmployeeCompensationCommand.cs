using MediatR;

namespace SoftPMS.Application.Features.EmployeeCompensations.Commands.DeleteEmployeeCompensation;

/// <summary>
/// Represents the Command to delete employee compensation.
/// </summary>
public record DeleteEmployeeCompensationCommand(Guid Id) : IRequest<Unit>;


