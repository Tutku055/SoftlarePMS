using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetFilterOperators;

/// <summary>
/// Represents the Query to get filter operators.
/// </summary>
public class GetFilterOperatorsQuery : IRequest<FilterOperatorsDto>
{
}


