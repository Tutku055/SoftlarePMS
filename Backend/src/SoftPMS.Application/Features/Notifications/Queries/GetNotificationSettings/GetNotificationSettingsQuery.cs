using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetNotificationSettings;

public record GetNotificationSettingsQuery : IRequest<List<NotificationTypeSettingDto>>;
