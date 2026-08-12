using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetFilterOperators;

public class GetFilterOperatorsQuery : IRequest<FilterOperatorsDto>
{
}
