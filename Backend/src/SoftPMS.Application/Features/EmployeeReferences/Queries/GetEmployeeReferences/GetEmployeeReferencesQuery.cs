using MediatR;
using SoftPMS.Application.DTOs.EmployeeReference;

namespace SoftPMS.Application.Features.EmployeeReferences.Queries.GetEmployeeReferences;

public record GetEmployeeReferencesQuery(Guid EmployeeId) : IRequest<List<EmployeeReferenceDto>>;
