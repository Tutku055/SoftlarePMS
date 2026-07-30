using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Permissions.DTOs;
using SoftPMS.Application.Features.Permissions.Queries.GetPermissions;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class PermissionsController : ApiControllerBase
{
    /// <summary>Get all available system permissions.</summary>
    [HttpGet]
    [HasPermission("Permissions.Read", "Permissions.Assign")]
    [ProducesResponseType(typeof(IEnumerable<PermissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetPermissionsQuery(), ct));
    }
}
