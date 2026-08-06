using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Application.Features.Documents.Commands.UploadDocument;
using SoftPMS.Application.Features.Documents.Commands.UploadDocumentChunk;
using SoftPMS.Application.Features.Documents.Commands.DeleteDocument;
using SoftPMS.Application.Features.Documents.Commands.UpdateDocument;
using SoftPMS.Application.Features.Documents.Commands.CheckDocumentsIntegrity;
using SoftPMS.Application.Features.Documents.Commands.DownloadDocument;
using SoftPMS.Application.Features.Documents.Queries;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
public sealed class DocumentsController : ApiControllerBase
{
    private readonly FileExtensionContentTypeProvider _contentTypeProvider;

    public DocumentsController()
    {
        _contentTypeProvider = new FileExtensionContentTypeProvider();
    }

    /// <summary>Get a paginated list of documents filtered by entity reference.</summary>
    [HttpGet]
    [HasPermission("Documents.Read")]
    [ProducesResponseType(typeof(PaginatedList<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(
        [FromQuery] GetDocumentsQuery query,
        CancellationToken ct = default)
    {
        return Ok(await Sender.Send(query, ct));
    }

    /// <summary>Upload a new document to the vault.</summary>
    [HttpPost("upload")]
    [DisableRequestSizeLimit]
    [HasPermission("Documents.Create")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument(
        [FromForm] IFormFile file,
        [FromForm] Guid referenceId,
        [FromForm] DocumentModule ownerModule,
        [FromForm] DocumentType documentType,
        [FromForm] DateTime? issueDate,
        [FromForm] DateTime? expiryDate,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "File is empty." });

        var command = new UploadDocumentCommand
        {
            FileStream = file.OpenReadStream(),
            FileName = file.FileName,
            FileLength = file.Length,
            ReferenceId = referenceId,
            OwnerModule = ownerModule,
            DocumentType = documentType,
            IssueDate = issueDate,
            ExpiryDate = expiryDate
        };
        
        var documentId = await Sender.Send(command, ct);
        return CreatedAtAction(nameof(GetDocument), new { id = documentId }, new { Id = documentId });
    }

    /// <summary>Upload a document chunk to the vault.</summary>
    [HttpPost("upload-chunk")]
    [DisableRequestSizeLimit]
    [HasPermission("Documents.Create")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadChunk(
        [FromForm] IFormFile file,
        [FromForm] string uploadId,
        [FromForm] int chunkIndex,
        [FromForm] int totalChunks,
        [FromForm] string fileName,
        [FromForm] Guid referenceId,
        [FromForm] DocumentModule ownerModule,
        [FromForm] DocumentType documentType,
        [FromForm] DateTime? issueDate,
        [FromForm] DateTime? expiryDate,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Chunk is empty." });

        var command = new UploadDocumentChunkCommand
        {
            ChunkStream = file.OpenReadStream(),
            UploadId = uploadId,
            ChunkIndex = chunkIndex,
            TotalChunks = totalChunks,
            FileName = fileName,
            ReferenceId = referenceId,
            OwnerModule = ownerModule,
            DocumentType = documentType,
            IssueDate = issueDate,
            ExpiryDate = expiryDate
        };

        var documentId = await Sender.Send(command, ct);

        if (documentId.HasValue)
        {
            return Ok(new { Id = documentId.Value, Completed = true });
        }

        return Ok(new { Completed = false });
    }

    /// <summary>Delete a document permanently from the vault.</summary>
    [HttpDelete("{id:guid}")]
    [HasPermission("Documents.Delete")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id, CancellationToken ct)
    {
        await Sender.Send(new DeleteDocumentCommand { Id = id }, ct);
        return NoContent();
    }

    /// <summary>Download a document from the vault.</summary>
    [HttpGet("{id:guid}/download")]
    [HasPermission("Documents.Read")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new DownloadDocumentCommand(id), ct);

        if (result == null)
        {
            return NotFound(new { message = "File is not available on disk." });
        }

        if (!_contentTypeProvider.TryGetContentType(result.FileName, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return File(result.Stream, contentType, result.FileName);
    }
    
    /// <summary>Get document metadata.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Documents.Read")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> GetDocument(Guid id, CancellationToken ct)
    {
        return Ok(await Sender.Send(new GetDocumentByIdQuery { Id = id }, ct));
    }
    
    /// <summary>Update document metadata.</summary>
    [HttpPut("{id:guid}")]
    [HasPermission("Documents.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDocument(Guid id, [FromBody] UpdateDocumentCommand command, CancellationToken ct)
    {
        if (id != command.Id)
            return BadRequest(new { message = "ID mismatch" });

        await Sender.Send(command, ct);
        return NoContent();
    }

    /// <summary>Check and sync physical document integrity.</summary>
    [HttpPost("check-integrity")]
    [HasPermission("Documents.Update")]
    [ProducesResponseType(typeof(IntegrityCheckResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckIntegrity(CancellationToken ct)
    {
        return Ok(await Sender.Send(new CheckDocumentsIntegrityCommand(), ct));
    }
}
