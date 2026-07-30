using FluentValidation;

namespace SoftPMS.Application.Features.Professions.Commands.UpdateProfession;

public sealed class UpdateProfessionCommandValidator : AbstractValidator<UpdateProfessionCommand>
{
    public UpdateProfessionCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(150).WithMessage("Name must not exceed 150 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
    }
}
