using FluentValidation;

namespace SoftPMS.Application.Features.Notifications.Commands.AdjustNotificationThreshold;

public class AdjustNotificationThresholdCommandValidator : AbstractValidator<AdjustNotificationThresholdCommand>
{
    public AdjustNotificationThresholdCommandValidator()
    {
        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Invalid notification type specified.");

        RuleFor(x => x.ReminderDays)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Reminder days must be 0 or greater.")
            .LessThanOrEqualTo(365)
            .WithMessage("Reminder days cannot exceed 365 days.");

        RuleFor(x => x.DeliveryChannel)
            .IsInEnum()
            .WithMessage("Invalid delivery channel specified.");
    }
}
