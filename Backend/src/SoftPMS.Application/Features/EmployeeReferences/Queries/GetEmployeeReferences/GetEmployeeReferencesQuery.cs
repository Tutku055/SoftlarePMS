using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Queries.GetEmployeeReferences;

/// <summary>
/// Represents the Query to get employee references.
/// </summary>
public record GetEmployeeReferencesQuery(Guid EmployeeId) : IRequest<List<EmployeeReferenceDto>>;


