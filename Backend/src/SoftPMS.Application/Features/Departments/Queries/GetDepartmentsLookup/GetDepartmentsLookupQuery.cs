using MediatR;
using SoftPMS.Application.Features.Departments.DTOs;

namespace SoftPMS.Application.Features.Departments.Queries.GetDepartmentsLookup;

/// <summary>
/// Represents the Query to get departments lookup.
/// </summary>
public sealed record GetDepartmentsLookupQuery : IRequest<List<DepartmentLookupDto>>;


