using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;

namespace SoftPMS.Application.Features.EmployeeNotes.Queries.GetEmployeeNotes;

public sealed class GetEmployeeNotesQueryHandler(
    IApplicationDbContext context,
    IMapper mapper,
    ICurrentUserService currentUserService) : IRequestHandler<GetEmployeeNotesQuery, List<EmployeeNoteDto>>
{
    public async Task<List<EmployeeNoteDto>> Handle(GetEmployeeNotesQuery request, CancellationToken cancellationToken)
    {
        var query = context.EmployeeNotes
            .AsNoTracking()
            .Where(n => n.EmployeeId == request.EmployeeId);

        if (request.Category.HasValue)
        {
            query = query.Where(n => n.Category == request.Category.Value);
        }

        if (request.IsConfidential.HasValue)
        {
            query = query.Where(n => n.IsConfidential == request.IsConfidential.Value);
        }

        var hasReadConfidential = currentUserService.Permissions.Contains("EmployeeNotes.ReadConfidential");
        var userId = currentUserService.UserId;

        // "Ensure non-confidential authorized users cannot receive confidential notes in the SQL result unless they created them."
        if (!hasReadConfidential)
        {
            query = query.Where(n => !n.IsConfidential || n.CreatedByUserId == userId);
        }

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .ProjectTo<EmployeeNoteDto>(mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);
    }
}
