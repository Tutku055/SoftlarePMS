using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;

public sealed class CreateOvertimeTypeCommandHandler(
    IApplicationDbContext context) : IRequestHandler<CreateOvertimeTypeCommand, Guid>
{
    public async Task<Guid> Handle(CreateOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = new OvertimeType
        {
            Name = request.Name,
            Multiplier = request.Multiplier
        };

        context.OvertimeTypes.Add(overtimeType);
        await context.SaveChangesAsync(cancellationToken);

        return overtimeType.Id;
    }
}
