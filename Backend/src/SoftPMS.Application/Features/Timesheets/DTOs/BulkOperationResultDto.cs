namespace SoftPMS.Application.Features.Timesheets.DTOs;

public record BulkOperationResultDto(
    int Processed,
    int Skipped,
    Dictionary<string, List<string>> SkippedReasons
);
