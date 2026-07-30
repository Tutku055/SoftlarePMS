using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Professions.Commands.DeleteProfession;

public sealed class DeleteProfessionCommandHandler(
    IApplicationDbContext context)
    : IRequestHandler<DeleteProfessionCommand>
{
    public async Task Handle(DeleteProfessionCommand request, CancellationToken cancellationToken)
    {
        // Use IgnoreQueryFilters to find it even if it's already soft-deleted
        var profession = await context.Professions
            .IgnoreQueryFilters()
            .Include(p => p.Employees)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Profession), request.Id);

        // Cannot delete a profession if it is currently active
        if (profession.IsActive)
        {
            throw new DomainException("Cannot delete an active profession. Deactivate it first.");
        }

        if (profession.Employees.Any())
        {
            throw new DomainException("Cannot delete profession because it is assigned to one or more employees.");
        }

        if (request.HardDelete)
        {
            context.Professions.Remove(profession);
        }
        else
        {
            profession.IsDeleted = true;
            context.Professions.Update(profession);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
