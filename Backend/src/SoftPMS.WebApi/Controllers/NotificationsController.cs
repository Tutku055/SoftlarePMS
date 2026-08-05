using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Notifications.Commands.AdjustNotificationThreshold;
using SoftPMS.Application.Features.Notifications.Commands.DeleteNotification;
using SoftPMS.Application.Features.Notifications.Commands.MarkAllNotificationsAsRead;
using SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsRead;
using SoftPMS.Application.Features.Notifications.Commands.MarkNotificationAsUnread;
using SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationMute;
using SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationReadStatus;
using SoftPMS.Application.Features.Notifications.Commands.TriggerPassiveNotificationEvaluation;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Application.Features.Notifications.Queries.GetMyNotifications;
using SoftPMS.Application.Features.Notifications.Queries.GetNotificationSettings;
using SoftPMS.Application.Features.Notifications.Queries.GetUnreadCount;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class NotificationsController : ApiControllerBase
{
    /// <summary>Get personal paginated notifications with optional type and read status filters.</summary>
    [HttpGet]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(typeof(PaginatedList<UserNotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications([FromQuery] GetMyNotificationsQuery query, CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Get unread notifications count for current user badge.</summary>
    [HttpGet("unread-count")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(typeof(NotificationSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetUnreadNotificationCountQuery(), ct));
    }

    /// <summary>Toggle read/unread status for a single notification.</summary>
    [HttpPatch("{id:guid}/toggle-read")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(typeof(UserNotificationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleRead(Guid id, CancellationToken ct)
    {
        return Ok(await Sender.Send(new ToggleNotificationReadStatusCommand(id), ct));
    }

    /// <summary>Mark a single notification as read.</summary>
    [HttpPatch("{id:guid}/read")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken ct)
    {
        await Sender.Send(new MarkNotificationAsReadCommand(id), ct);
        return NoContent();
    }

    /// <summary>Mark a single notification as unread.</summary>
    [HttpPatch("{id:guid}/unread")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsUnread(Guid id, CancellationToken ct)
    {
        await Sender.Send(new MarkNotificationAsUnreadCommand(id), ct);
        return NoContent();
    }

    /// <summary>Mark all unread notifications for current user as read.</summary>
    [HttpPatch("read-all")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var count = await Sender.Send(new MarkAllNotificationsAsReadCommand(), ct);
        return Ok(new { MarkedReadCount = count });
    }

    /// <summary>Delete a notification from personal inbox.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Notifications.Read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteNotificationCommand(id), ct);
        return NoContent();
    }

    /// <summary>Get all configurable passive notification type settings.</summary>
    [HttpGet("settings")]
    [HasPermission("Notifications.AdjustThresholds")]
    [ProducesResponseType(typeof(List<NotificationTypeSettingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetNotificationSettingsQuery(), ct));
    }

    /// <summary>Adjust reminder threshold days and delivery channel for a notification type.</summary>
    [HttpPut("settings/{type}/threshold")]
    [HasPermission("Notifications.AdjustThresholds")]
    [ProducesResponseType(typeof(NotificationTypeSettingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AdjustThreshold(
        NotificationType type,
        [FromBody] AdjustNotificationThresholdDto dto,
        CancellationToken ct)
    {
        var command = new AdjustNotificationThresholdCommand(type, dto.ReminderDays, dto.DeliveryChannel);
        return Ok(await Sender.Send(command, ct));
    }

    /// <summary>Mute or unmute a passive notification type.</summary>
    [HttpPut("settings/{type}/mute")]
    [HasPermission("Notifications.Mute")]
    [ProducesResponseType(typeof(NotificationTypeSettingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleMute(
        NotificationType type,
        [FromBody] ToggleNotificationMuteDto dto,
        CancellationToken ct)
    {
        var command = new ToggleNotificationMuteCommand(type, dto.IsMuted);
        return Ok(await Sender.Send(command, ct));
    }

    /// <summary>Trigger passive notification evaluation on-demand.</summary>
    [HttpPost("evaluate")]
    [HasPermission("Notifications.AdjustThresholds")]
    [ProducesResponseType(typeof(Dictionary<string, int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> EvaluateNotifications(CancellationToken ct)
    {
        var results = await Sender.Send(new TriggerPassiveNotificationEvaluationCommand(), ct);
        return Ok(results);
    }
}
