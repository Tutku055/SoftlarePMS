using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;

/// <summary>
/// Represents the Command to check documents integrity.
/// </summary>
public class CheckDocumentsIntegrityCommand : IRequest<IntegrityCheckResultDto>
{
}

/// <summary>
/// Represents the Command to check documents integrity.
/// </summary>
public class IntegrityCheckResultDto
{
    public int TotalChecked { get; set; }
    public int MissingCount { get; set; }
    public int AvailableCount { get; set; }
}



