using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Queries.GetDepartmentById;

public sealed record GetDepartmentByIdQuery(Guid Id) : IRequest<DepartmentDto>;
