using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Calendar.Commands.CreateCalendarEvent;
using SoftPMS.Application.Features.Calendar.Commands.CreateCalendarNote;
using SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarEvent;
using SoftPMS.Application.Features.Calendar.Commands.DeleteCalendarNote;
using SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarEvent;
using SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarNote;
using SoftPMS.Application.Features.Calendar.Commands.UpdateCalendarSettings;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarByDateRange;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarEventById;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarNoteById;
using SoftPMS.Application.Features.Calendar.Queries.GetCalendarSettings;
using SoftPMS.Application.Features.Calendar.Queries.GetMonthlyCalendar;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public class CalendarController : ApiControllerBase
{
    /// <summary>Get calendar schedule for an arbitrary date range (e.g. multi-month week, rolling 30-day agenda).</summary>
    [HttpGet("range")]
    [HasPermission("Calendar.Read")]
    public async Task<IActionResult> GetCalendarByRange([FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
    {
        var result = await Sender.Send(new GetCalendarByDateRangeQuery(startDate, endDate));
        return Ok(result);
    }

    /// <summary>Get monthly calendar schedule combining physical events, notes, public holidays, and birthdays.</summary>
    [HttpGet("monthly")]
    [HasPermission("Calendar.Read")]
    public async Task<IActionResult> GetMonthlyCalendar([FromQuery] int year, [FromQuery] int month)
    {
        var result = await Sender.Send(new GetMonthlyCalendarQuery(year, month));
        return Ok(result);
    }

    /// <summary>Get calendar event by ID.</summary>
    [HttpGet("events/{id:guid}")]
    [HasPermission("Calendar.Read")]
    public async Task<IActionResult> GetCalendarEvent(Guid id)
    {
        var result = await Sender.Send(new GetCalendarEventByIdQuery(id));
        return Ok(result);
    }

    /// <summary>Create a new physical calendar event.</summary>
    [HttpPost("events")]
    [HasPermission("Calendar.CreateEvent", "Calendar.CreateConfidentialEvents")]
    public async Task<IActionResult> CreateCalendarEvent([FromBody] CreateCalendarEventCommand command)
    {
        var id = await Sender.Send(command);
        return CreatedAtAction(nameof(GetCalendarEvent), new { id }, new { id });
    }

    /// <summary>Update an existing physical calendar event.</summary>
    [HttpPut("events/{id:guid}")]
    [HasPermission("Calendar.UpdateEvent", "Calendar.UpdateConfidentialEvents")]
    public async Task<IActionResult> UpdateCalendarEvent(Guid id, [FromBody] UpdateCalendarEventCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { message = "Route ID must match payload ID." });
        }

        await Sender.Send(command);
        return NoContent();
    }

    /// <summary>Delete a physical calendar event.</summary>
    [HttpDelete("events/{id:guid}")]
    [HasPermission("Calendar.DeleteEvent", "Calendar.DeleteConfidentialEvents")]
    public async Task<IActionResult> DeleteCalendarEvent(Guid id)
    {
        await Sender.Send(new DeleteCalendarEventCommand(id));
        return NoContent();
    }

    /// <summary>Get calendar personal note by ID.</summary>
    [HttpGet("notes/{id:guid}")]
    [HasPermission("Calendar.Read", "Calendar.ReadConfidentialNotes")]
    public async Task<IActionResult> GetCalendarNote(Guid id)
    {
        var result = await Sender.Send(new GetCalendarNoteByIdQuery(id));
        return Ok(result);
    }

    /// <summary>Create a personal calendar note.</summary>
    [HttpPost("notes")]
    [HasPermission("Calendar.CreateNote", "Calendar.CreateConfidentialNotes")]
    public async Task<IActionResult> CreateCalendarNote([FromBody] CreateCalendarNoteCommand command)
    {
        var id = await Sender.Send(command);
        return CreatedAtAction(nameof(GetCalendarNote), new { id }, new { id });
    }

    /// <summary>Update an existing calendar note.</summary>
    [HttpPut("notes/{id:guid}")]
    [HasPermission("Calendar.UpdateNote", "Calendar.UpdateConfidentialNotes")]
    public async Task<IActionResult> UpdateCalendarNote(Guid id, [FromBody] UpdateCalendarNoteCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { message = "Route ID must match payload ID." });
        }

        await Sender.Send(command);
        return NoContent();
    }

    /// <summary>Delete a calendar note.</summary>
    [HttpDelete("notes/{id:guid}")]
    [HasPermission("Calendar.DeleteNote", "Calendar.DeleteConfidentialNotes")]
    public async Task<IActionResult> DeleteCalendarNote(Guid id)
    {
        await Sender.Send(new DeleteCalendarNoteCommand(id));
        return NoContent();
    }

    /// <summary>Get calendar configuration settings.</summary>
    [HttpGet("settings")]
    [HasPermission("Calendar.Read")]
    public async Task<IActionResult> GetCalendarSettings()
    {
        var result = await Sender.Send(new GetCalendarSettingsQuery());
        return Ok(result);
    }

    /// <summary>Update global calendar settings.</summary>
    [HttpPut("settings")]
    [HasPermission("Calendar.ManageSettings")]
    public async Task<IActionResult> UpdateCalendarSettings([FromBody] UpdateCalendarSettingsCommand command)
    {
        await Sender.Send(command);
        return NoContent();
    }
}
