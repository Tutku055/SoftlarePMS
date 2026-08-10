using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Calendar.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Queries.GetCalendarEventById;

public record GetCalendarEventByIdQuery(Guid Id) : IRequest<CalendarEventDto>;

