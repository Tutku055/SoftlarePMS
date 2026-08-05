using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.TriggerPassiveNotificationEvaluation;

public record TriggerPassiveNotificationEvaluationCommand : IRequest<Dictionary<string, int>>;
