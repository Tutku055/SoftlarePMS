using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using SoftPMS.Application.Common.Interfaces;

namespace SoftPMS.WebApi.Controllers;

[AllowAnonymous]
[Route("api/[controller]")]
public class VaultController(IStorageService storageService) : ControllerBase
{
    [HttpGet("{*path}")]
    public async Task<IActionResult> GetFile(string path, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest();

        if (!await storageService.FileExistsAsync(path, ct))
            return NotFound();

        var stream = await storageService.DownloadAsync(path, ct);
        
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(path, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return File(stream, contentType);
    }
}
