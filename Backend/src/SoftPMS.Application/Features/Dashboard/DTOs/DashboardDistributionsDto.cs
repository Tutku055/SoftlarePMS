namespace SoftPMS.Application.Features.Dashboard.DTOs;

public class DashboardDistributionsDto
{
    public List<ChartDistributionItemDto> DepartmentDistribution { get; set; } = new();
    public List<ChartDistributionItemDto> ProfessionDistribution { get; set; } = new();
}

public class ChartDistributionItemDto
{
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; }
    public bool IsOther { get; set; }
    
    // Detailed list if IsOther is true, or just all names that fall into this category
    public List<string> SubItems { get; set; } = new();
}
