using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarNote;

public record UpdateCalendarNoteCommand(
    Guid Id,
    DateOnly NoteDate,
    string Content,
    string ColorCode,
    VisibilityLevel VisibilityLevel
) : IRequest<Unit>;

