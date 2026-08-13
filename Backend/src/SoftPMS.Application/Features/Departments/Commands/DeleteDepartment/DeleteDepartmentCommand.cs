using MediatR;

namespace SoftPMS.Application.Features.Departments.Commands.DeleteDepartment;

/// <summary>
/// Represents the Command to delete department.
/// </summary>
public sealed record DeleteDepartmentCommand(Guid Id) : IRequest<Unit>;


