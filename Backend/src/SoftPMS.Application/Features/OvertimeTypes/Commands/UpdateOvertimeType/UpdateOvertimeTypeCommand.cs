using MediatR;
using System;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;

/// <summary>
/// Represents the Command to update overtime type.
/// </summary>
public record UpdateOvertimeTypeCommand(Guid Id, string Name, decimal Multiplier) : IRequest<Unit>;


