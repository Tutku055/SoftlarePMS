using FluentValidation;

namespace SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsUnread;

public class MarkNotificationAsUnreadCommandValidator : AbstractValidator<MarkNotificationAsUnreadCommand>
{
    public MarkNotificationAsUnreadCommandValidator()
    {
    }
}
