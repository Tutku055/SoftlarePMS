using MediatR;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;

/// <summary>
/// Represents the Query to get overtime types.
/// </summary>
public record GetOvertimeTypesQuery(bool IncludeDeleted = false) : IRequest<List<OvertimeTypeDto>>;


