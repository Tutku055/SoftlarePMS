using FluentValidation;

namespace SoftPMS.Application.Features.Notifications.Commands.DeleteNotification;

public class DeleteNotificationCommandValidator : AbstractValidator<DeleteNotificationCommand>
{
    public DeleteNotificationCommandValidator()
    {
    }
}
