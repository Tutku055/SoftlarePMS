using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Queries.GetDepartmentById;

/// <summary>
/// Represents the Query to get department by id.
/// </summary>
public sealed record GetDepartmentByIdQuery(Guid Id) : IRequest<DepartmentDto>;



