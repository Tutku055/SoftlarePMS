using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarNote;

/// <summary>
/// Represents the Command to delete calendar note.
/// </summary>
public record DeleteCalendarNoteCommand(Guid Id) : IRequest<Unit>;



