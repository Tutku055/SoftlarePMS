using MediatR;
using SoftPMS.Application.Features.Notifications.Services;

namespace SoftPMS.Application.Features.Notifications.Commands.TriggerPassiveNotificationEvaluation;

public class TriggerPassiveNotificationEvaluationCommandHandler : IRequestHandler<TriggerPassiveNotificationEvaluationCommand, Dictionary<string, int>>
{
    private readonly IPassiveNotificationEvaluator _evaluator;

    public TriggerPassiveNotificationEvaluationCommandHandler(IPassiveNotificationEvaluator evaluator)
    {
        _evaluator = evaluator;
    }

    public async Task<Dictionary<string, int>> Handle(
        TriggerPassiveNotificationEvaluationCommand request,
        CancellationToken cancellationToken)
    {
        return await _evaluator.EvaluateAllAsync(cancellationToken);
    }
}
