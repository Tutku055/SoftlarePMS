using FluentValidation;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationMute;

public class ToggleNotificationMuteCommandValidator : AbstractValidator<ToggleNotificationMuteCommand>
{
    public ToggleNotificationMuteCommandValidator()
    {
    }
}
