using MediatR;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;

/// <summary>
/// Represents the Command to create overtime type.
/// </summary>
public record CreateOvertimeTypeCommand(string Name, decimal Multiplier) : IRequest<Guid>;


