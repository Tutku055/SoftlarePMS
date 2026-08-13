using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats;

/// <summary>
/// Represents the Query to get year end employee stats.
/// </summary>
public record GetYearEndEmployeeStatsQuery(int Year) : IRequest<YearEndStatsDto>;


