using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.CreateOvertimeType;

public record CreateOvertimeTypeCommand(string Name, decimal Multiplier) : IRequest<Guid>;

public class CreateOvertimeTypeCommandHandler : IRequestHandler<CreateOvertimeTypeCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateOvertimeTypeCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateOvertimeTypeCommand request, CancellationToken cancellationToken)
    {
        var overtimeType = new OvertimeType
        {
            Name = request.Name,
            Multiplier = request.Multiplier
        };

        _context.OvertimeTypes.Add(overtimeType);
        await _context.SaveChangesAsync(cancellationToken);

        return overtimeType.Id;
    }
}
