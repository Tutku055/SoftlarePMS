using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Commands.CreateDepartment;

public sealed record CreateDepartmentCommand(
    string Name,
    string Description
) : IRequest<DepartmentDto>;
