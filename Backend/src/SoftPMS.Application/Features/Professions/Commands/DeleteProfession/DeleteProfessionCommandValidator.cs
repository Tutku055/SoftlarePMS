using FluentValidation;

namespace SoftPMS.Application.Features.Professions.Commands.DeleteProfession;

public sealed class DeleteProfessionCommandValidator : AbstractValidator<DeleteProfessionCommand>
{
    public DeleteProfessionCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id is required.");
    }
}
