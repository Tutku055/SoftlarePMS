using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarSettings;

/// <summary>
/// Represents the Query to get calendar settings.
/// </summary>
public record GetCalendarSettingsQuery : IRequest<CalendarSettingsDto>;



