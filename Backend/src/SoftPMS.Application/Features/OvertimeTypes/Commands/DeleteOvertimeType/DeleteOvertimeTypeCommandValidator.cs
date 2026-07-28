using FluentValidation;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.DeleteOvertimeType;

public class DeleteOvertimeTypeCommandValidator : AbstractValidator<DeleteOvertimeTypeCommand>
{
    public DeleteOvertimeTypeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");
    }
}
