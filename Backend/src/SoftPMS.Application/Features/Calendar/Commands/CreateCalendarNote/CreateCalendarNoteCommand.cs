using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.CreateCalendarNote;

/// <summary>
/// Represents the Command to create calendar note.
/// </summary>
public record CreateCalendarNoteCommand(
    DateOnly NoteDate,
    string Content,
    string ColorCode,
    VisibilityLevel VisibilityLevel
) : IRequest<Guid>;



