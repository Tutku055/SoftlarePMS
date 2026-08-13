using MediatR;

namespace SoftPMS.Application.Features.Notifications.Commands.TriggerPassiveNotificationEvaluation;

/// <summary>
/// Represents the Command to trigger passive notification evaluation.
/// </summary>
public record TriggerPassiveNotificationEvaluationCommand : IRequest<Dictionary<string, int>>;


