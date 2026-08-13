using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Commands.CreateDepartment;

/// <summary>
/// Represents the Command to create department.
/// </summary>
public sealed record CreateDepartmentCommand(
    string Name,
    string Description
) : IRequest<DepartmentDto>;


