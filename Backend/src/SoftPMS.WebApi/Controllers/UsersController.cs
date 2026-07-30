using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Users.DTOs;
using SoftPMS.Application.Features.Users.Commands.AssignRoleToUser;
using SoftPMS.Application.Features.Users.Commands.CreateUser;
using SoftPMS.Application.Features.Users.Commands.DeleteUser;
using SoftPMS.Application.Features.Users.Commands.UpdateUser;
using SoftPMS.Application.Features.Users.Queries.GetUserById;
using SoftPMS.Application.Features.Users.Queries.GetUsers;
using SoftPMS.Application.Features.Users.Queries.GetUsersWithPagination;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class UsersController : ApiControllerBase
{
    /// <summary>Get all users.</summary>
    [HttpGet]
    [HasPermission("Users.Read")]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetUsersQuery(), ct));
    }

    /// <summary>Get a paginated, filtered list of users.</summary>
    [HttpPost("search")]
    [HasPermission("Users.Read")]
    [ProducesResponseType(typeof(PaginatedList<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromBody] GetUsersWithPaginationQuery query, CancellationToken ct)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Get a single user by ID.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Users.Read")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetUserByIdQuery(id), ct));
    }

    /// <summary>Create a new user account.</summary>
    [HttpPost]
    [HasPermission("Users.Create")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto, CancellationToken ct)
    {
        var result = await Sender.Send(new CreateUserCommand(dto), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Update a user's profile information.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Users.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto, CancellationToken ct)
    {
        await Sender.Send(new UpdateUserCommand(id, dto), ct);
        return NoContent();
    }

    /// <summary>Delete a user account.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Users.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteUserCommand(id), ct);
        return NoContent();
    }

    /// <summary>Replace the complete role set for a user.</summary>
    [HttpPut("{id:guid}/role")]
    [HasPermission("Users.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignRole(
        Guid id,
        [FromBody] SoftPMS.Application.Features.Users.DTOs.AssignRoleRequestDto request,
        CancellationToken ct)
    {
        await Sender.Send(new AssignRoleToUserCommand(id, request.RoleId), ct);
        return NoContent();
    }

    /// <summary>Change a user's password.</summary>
    [HttpPost("{id:guid}/change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword(
        Guid id,
        [FromBody] SoftPMS.Application.Features.Users.DTOs.ChangePasswordRequestDto request,
        CancellationToken ct)
    {
        await Sender.Send(new Application.Features.Users.Commands.ChangePassword.ChangePasswordCommand(id, request.OldPassword, request.NewPassword), ct);
        return NoContent();
    }
}
