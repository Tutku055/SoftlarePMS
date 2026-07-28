using FluentValidation;

namespace SoftPMS.Application.Features.OvertimeTypes.Commands.UpdateOvertimeType;

public class UpdateOvertimeTypeCommandValidator : AbstractValidator<UpdateOvertimeTypeCommand>
{
    public UpdateOvertimeTypeCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

        RuleFor(x => x.Multiplier)
            .GreaterThan(0).WithMessage("Multiplier must be greater than 0.");
    }
}
