using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Queries.GetDepartmentsLookup;

public sealed record GetDepartmentsLookupQuery : IRequest<List<DepartmentLookupDto>>;
