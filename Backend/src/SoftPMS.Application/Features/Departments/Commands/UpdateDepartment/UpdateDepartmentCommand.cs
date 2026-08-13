using MediatR;

namespace SoftPMS.Application.Features.Departments.Commands.UpdateDepartment;

/// <summary>
/// Represents the Command to update department.
/// </summary>
public sealed record UpdateDepartmentCommand(
    Guid Id,
    string Name,
    string Description
) : IRequest<Unit>;


