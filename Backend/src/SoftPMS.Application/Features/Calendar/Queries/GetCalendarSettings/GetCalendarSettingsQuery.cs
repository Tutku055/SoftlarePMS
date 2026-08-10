using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarSettings;

public record GetCalendarSettingsQuery : IRequest<CalendarSettingsDto>;

