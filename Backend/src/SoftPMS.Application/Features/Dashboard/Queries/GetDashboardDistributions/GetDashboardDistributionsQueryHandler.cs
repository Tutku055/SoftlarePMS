using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Dashboard.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Dashboard.Queries.GetDashboardDistributions;

public class GetDashboardDistributionsQueryHandler : IRequestHandler<GetDashboardDistributionsQuery, DashboardDistributionsDto>
{
    private readonly IApplicationDbContext _context;

    public GetDashboardDistributionsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDistributionsDto> Handle(GetDashboardDistributionsQuery request, CancellationToken cancellationToken)
    {
        var dto = new DashboardDistributionsDto();

        // 1. Department Distribution (Top 5 + Other)
        var deptStats = await _context.Employees
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active)
            .GroupBy(e => e.Department != null ? e.Department.Name : "Unassigned")
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var topDepts = deptStats.Take(5).ToList();
        var otherDepts = deptStats.Skip(5).ToList();

        dto.DepartmentDistribution.AddRange(topDepts.Select(d => new ChartDistributionItemDto
        {
            Name = d.Name,
            Value = d.Count,
            IsOther = false,
            SubItems = new List<string> { d.Name }
        }));

        if (otherDepts.Any())
        {
            dto.DepartmentDistribution.Add(new ChartDistributionItemDto
            {
                Name = "Other",
                Value = otherDepts.Sum(d => d.Count),
                IsOther = true,
                SubItems = otherDepts.Select(d => $"{d.Name} ({d.Count})").ToList()
            });
        }

        // 2. Profession Distribution (Top 1 + Other, or maybe Top 3 + Other for better visuals)
        // The user asked: "En popüler meslek grubu görsel olarak öne çıkarılmalı... diğerleri mantıklı bir "Other" grubuyla birleştirilmeli."
        // We will return Top 3 + Other, frontend can highlight the first one.
        var profStats = await _context.Employees
            .Where(e => !e.IsDeleted && e.EmploymentStatus == EmploymentStatus.Active)
            .GroupBy(e => e.Profession != null ? e.Profession.Name : "Unspecified")
            .Select(g => new { Name = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var topProfs = profStats.Take(3).ToList();
        var otherProfs = profStats.Skip(3).ToList();

        dto.ProfessionDistribution.AddRange(topProfs.Select(p => new ChartDistributionItemDto
        {
            Name = p.Name,
            Value = p.Count,
            IsOther = false,
            SubItems = new List<string> { p.Name }
        }));

        if (otherProfs.Any())
        {
            dto.ProfessionDistribution.Add(new ChartDistributionItemDto
            {
                Name = "Other",
                Value = otherProfs.Sum(p => p.Count),
                IsOther = true,
                SubItems = otherProfs.Select(p => $"{p.Name} ({p.Count})").ToList()
            });
        }

        return dto;
    }
}
