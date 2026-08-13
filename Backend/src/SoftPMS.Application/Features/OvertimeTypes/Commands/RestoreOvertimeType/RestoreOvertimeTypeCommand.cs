using MediatR;
using System;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType;

/// <summary>
/// Represents the Command to restore overtime type.
/// </summary>
public record RestoreOvertimeTypeCommand(Guid Id) : IRequest;


