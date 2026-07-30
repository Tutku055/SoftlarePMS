using MediatR;

namespace SoftPMS.Application.Features.SystemSettings.Commands.CloseYearAndRolloverLeaves;

public record CloseYearAndRolloverLeavesCommand(int YearToClose) : IRequest<Unit>;
