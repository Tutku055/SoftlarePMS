using FluentValidation;

namespace SoftPMS.Application.Features.Professions.Commands.CreateProfession;

public sealed class CreateProfessionCommandValidator : AbstractValidator<CreateProfessionCommand>
{
    public CreateProfessionCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(150).WithMessage("Name must not exceed 150 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters.");
    }
}
