using MediatR;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;

/// <summary>
/// Represents the Command to delete overtime type.
/// </summary>
public record DeleteOvertimeTypeCommand(Guid Id) : IRequest<Unit>;


