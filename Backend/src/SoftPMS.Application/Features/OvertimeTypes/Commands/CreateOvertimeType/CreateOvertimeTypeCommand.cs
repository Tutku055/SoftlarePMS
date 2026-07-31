using MediatR;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;

public record CreateOvertimeTypeCommand(string Name, decimal Multiplier) : IRequest<Guid>;
