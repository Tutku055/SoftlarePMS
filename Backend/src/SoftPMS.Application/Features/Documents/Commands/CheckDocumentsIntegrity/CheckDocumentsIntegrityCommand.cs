using MediatR;

namespace SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;

public class CheckDocumentsIntegrityCommand : IRequest<IntegrityCheckResultDto>
{
}

public class IntegrityCheckResultDto
{
    public int TotalChecked { get; set; }
    public int MissingCount { get; set; }
    public int AvailableCount { get; set; }
}
