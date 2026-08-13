using MediatR;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.DeleteEmployeeReference;

/// <summary>
/// Represents the Command to delete employee reference.
/// </summary>
public record DeleteEmployeeReferenceCommand(Guid ReferenceId) : IRequest;


