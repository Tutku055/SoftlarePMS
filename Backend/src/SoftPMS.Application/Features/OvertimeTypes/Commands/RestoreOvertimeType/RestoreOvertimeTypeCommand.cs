using MediatR;
using System;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType;

public record RestoreOvertimeTypeCommand(Guid Id) : IRequest;
