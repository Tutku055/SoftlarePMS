using MediatR;
using System;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;

public record UpdateOvertimeTypeCommand(Guid Id, string Name, decimal Multiplier) : IRequest<Unit>;
