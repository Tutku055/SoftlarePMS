using MediatR;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetUnreadCount;

/// <summary>
/// Represents the Query to get unread notification count.
/// </summary>
public record GetUnreadNotificationCountQuery : IRequest<NotificationSummaryDto>;


