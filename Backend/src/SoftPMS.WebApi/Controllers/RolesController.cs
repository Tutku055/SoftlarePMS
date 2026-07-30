using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Employees.DTOs;
using SoftPMS.Application.Features.Roles.DTOs;
using SoftPMS.Application.Features.Roles.Commands.AssignPermissionsToRole;
using SoftPMS.Application.Features.Roles.Commands.CreateRole;
using SoftPMS.Application.Features.Roles.Commands.DeleteRole;
using SoftPMS.Application.Features.Roles.Commands.UpdateRole;
using SoftPMS.Application.Features.Roles.Queries.GetRoleById;
using SoftPMS.Application.Features.Roles.Queries.GetRoles;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class RolesController : ApiControllerBase
{
    /// <summary>Get all roles.</summary>
    [HttpGet]
    [HasPermission("Roles.Read")]
    [ProducesResponseType(typeof(IEnumerable<RoleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetRolesQuery(), ct));
    }

    /// <summary>Get a single role by its ID.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Roles.Read")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetRoleByIdQuery(id), ct));
    }

    /// <summary>Create a new role.</summary>
    [HttpPost]
    [HasPermission("Roles.Create")]
    [ProducesResponseType(typeof(RoleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateRoleDto dto, CancellationToken ct)
    {
        var result = await Sender.Send(new CreateRoleCommand(dto), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update an existing role's name and description.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Roles.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleDto dto, CancellationToken ct)
    {
        await Sender.Send(new UpdateRoleCommand(id, dto), ct);
        return NoContent();
    }

    /// <summary>Delete a role.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Roles.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteRoleCommand(id), ct);
        return NoContent();
    }

    /// <summary>Get a paginated list of roles.</summary>
    [HttpPost("search")]
    [HasPermission("Roles.Read")]
    [ProducesResponseType(typeof(PaginatedList<EmployeeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromBody] SoftPMS.Application.Features.Roles.Queries.GetRolesWithPagination.GetRolesWithPaginationQuery query, CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Replace the complete permission set for a role.</summary>
    [HttpPut("{id:guid}/permissions")]
    [HasPermission("Permissions.Assign")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignPermissions(
        Guid id,
        [FromBody] AssignPermissionsRequestDto request,
        CancellationToken ct)
    {
        await Sender.Send(new AssignPermissionsToRoleCommand(id, request.PermissionIds), ct);
        return NoContent();
    }

    /// <summary>Toggle role active status.</summary>
    [HttpPut("{id:guid}/toggle-active")]
    [HasPermission("Roles.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleActive(Guid id, CancellationToken ct)
    {
        await Sender.Send(new SoftPMS.Application.Features.Roles.Commands.ToggleRoleActive.ToggleRoleActiveCommand(id), ct);
        return NoContent();
    }
}
