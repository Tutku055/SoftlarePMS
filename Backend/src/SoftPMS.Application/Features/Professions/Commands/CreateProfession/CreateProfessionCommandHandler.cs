using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Professions.DTOs;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Exceptions;

namespace SoftPMS.Application.Features.Professions.Commands.CreateProfession;

public sealed class CreateProfessionCommandHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<CreateProfessionCommand, ProfessionDto>
{
    public async Task<ProfessionDto> Handle(CreateProfessionCommand request, CancellationToken cancellationToken)
    {
        var exists = await context.Professions
            .AnyAsync(p => p.Name == request.Name, cancellationToken);

        if (exists)
            throw new DomainException($"Profession with name '{request.Name}' already exists.");

        var profession = mapper.Map<Profession>(request);
        
        await context.Professions.AddAsync(profession, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<ProfessionDto>(profession);
    }
}
