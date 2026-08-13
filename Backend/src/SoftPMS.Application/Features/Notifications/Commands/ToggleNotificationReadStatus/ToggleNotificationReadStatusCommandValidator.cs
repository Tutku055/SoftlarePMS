using FluentValidation;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationReadStatus;

public class ToggleNotificationReadStatusCommandValidator : AbstractValidator<ToggleNotificationReadStatusCommand>
{
    public ToggleNotificationReadStatusCommandValidator()
    {
    }
}
