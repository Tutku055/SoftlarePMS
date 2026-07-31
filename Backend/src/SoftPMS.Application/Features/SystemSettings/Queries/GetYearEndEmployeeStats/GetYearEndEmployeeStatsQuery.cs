using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetYearEndEmployeeStats;

public record GetYearEndEmployeeStatsQuery(int Year) : IRequest<YearEndStatsDto>;
