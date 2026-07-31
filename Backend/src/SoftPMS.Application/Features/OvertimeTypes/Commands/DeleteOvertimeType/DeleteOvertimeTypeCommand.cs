using MediatR;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;

public record DeleteOvertimeTypeCommand(Guid Id) : IRequest<Unit>;
