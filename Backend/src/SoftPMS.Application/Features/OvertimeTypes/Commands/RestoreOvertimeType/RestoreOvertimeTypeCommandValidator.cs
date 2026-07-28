using FluentValidation;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.RestoreOvertimeType;

public class RestoreOvertimeTypeCommandValidator : AbstractValidator<RestoreOvertimeTypeCommand>
{
    public RestoreOvertimeTypeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");
    }
}
