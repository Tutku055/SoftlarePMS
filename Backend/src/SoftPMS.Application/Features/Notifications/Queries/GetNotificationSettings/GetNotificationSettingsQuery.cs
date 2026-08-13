using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetNotificationSettings;

/// <summary>
/// Represents the Query to get notification settings.
/// </summary>
public record GetNotificationSettingsQuery : IRequest<List<NotificationTypeSettingDto>>;


