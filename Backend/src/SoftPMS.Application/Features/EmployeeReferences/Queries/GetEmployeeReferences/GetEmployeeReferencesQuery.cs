using MediatR;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;

namespace SoftPMS.Application.Features.EmployeeReferences.Queries.GetEmployeeReferences;

public record GetEmployeeReferencesQuery(Guid EmployeeId) : IRequest<List<EmployeeReferenceDto>>;
