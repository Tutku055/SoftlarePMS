using MediatR;

namespace SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;

/// <summary>
/// Represents the Command to close year and rollover leaves.
/// </summary>
public record CloseYearAndRolloverLeavesCommand(int YearToClose) : IRequest<Unit>;


