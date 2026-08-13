using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Finance.DTOs;

namespace SoftPMS.Application.Features.Finance.Queries.GetMissingFinanceRecords;

/// <summary>
/// Represents the Query to get missing finance records.
/// </summary>
public class GetMissingFinanceRecordsQuery : IRequest<PaginatedList<MissingFinanceRecordDto>>
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string? MissingType { get; set; } // "Timesheet" | "Payroll" | "Both"
    public string? SearchTerm { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}


