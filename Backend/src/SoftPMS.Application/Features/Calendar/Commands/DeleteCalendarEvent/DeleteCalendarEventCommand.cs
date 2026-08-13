using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarEvent;

/// <summary>
/// Represents the Command to delete calendar event.
/// </summary>
public record DeleteCalendarEventCommand(Guid Id) : IRequest<Unit>;



