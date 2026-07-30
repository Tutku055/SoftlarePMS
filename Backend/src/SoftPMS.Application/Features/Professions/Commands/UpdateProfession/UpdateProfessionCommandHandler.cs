using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Professions.Commands.UpdateProfession;

public sealed class UpdateProfessionCommandHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<UpdateProfessionCommand>
{
    public async Task Handle(UpdateProfessionCommand request, CancellationToken cancellationToken)
    {
        var profession = await context.Professions
            .Include(p => p.Employees)
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Profession), request.Id);

        if (request.Name != profession.Name)
        {
            var exists = await context.Professions
                .AnyAsync(p => p.Name == request.Name && p.Id != request.Id, cancellationToken);

            if (exists)
                throw new DomainException($"Profession with name '{request.Name}' already exists.");
        }

        // If profession is assigned to any employee, active status cannot be set to false
        if (!request.IsActive && profession.Employees.Any())
        {
            throw new DomainException("Cannot deactivate profession because it is currently assigned to one or more employees.");
        }

        mapper.Map(request, profession);

        await context.SaveChangesAsync(cancellationToken);
    }
}
