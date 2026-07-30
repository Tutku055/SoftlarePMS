using FluentValidation;

namespace SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;

public class CheckDocumentsIntegrityCommandValidator : AbstractValidator<CheckDocumentsIntegrityCommand>
{
    public CheckDocumentsIntegrityCommandValidator()
    {
    }
}
