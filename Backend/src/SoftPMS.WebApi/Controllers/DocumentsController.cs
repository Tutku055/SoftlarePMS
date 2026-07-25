using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.DTOs.Document;
using SoftPMS.Application.Features.Documents.Commands;
using SoftPMS.Application.Features.Documents.Queries;
using SoftPMS.Domain.Enums;
using SoftPMS.WebApi.Authorization;

namespace SoftPMS.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
public sealed class DocumentsController : ApiControllerBase
{
    private readonly IStorageService _storageService;
    private readonly FileExtensionContentTypeProvider _contentTypeProvider;

    public DocumentsController(IStorageService storageService)
    {
        _storageService = storageService;
        _contentTypeProvider = new FileExtensionContentTypeProvider();
    }

    /// <summary>Get a paginated list of documents filtered by entity reference.</summary>
    [HttpGet]
    [HasPermission("Documents.Read")]
    [ProducesResponseType(typeof(PaginatedList<DocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocuments(
        [FromQuery] Guid? referenceId, 
        [FromQuery] DocumentModule? ownerModule, 
        [FromQuery] DocumentType? documentType, 
        [FromQuery] string? fileName,
        [FromQuery] string? fileNameOperator,
        [FromQuery] long? minFileSizeBytes,
        [FromQuery] long? maxFileSizeBytes,
        [FromQuery] string? extension,
        [FromQuery] string? extensionOperator,
        [FromQuery] DateTime? expiryDateStart,
        [FromQuery] DateTime? expiryDateEnd,
        [FromQuery] DateTime? uploadDateStart,
        [FromQuery] DateTime? uploadDateEnd,
        [FromQuery] string? quickSearch,
        [FromQuery] bool? isAvailable,
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetDocumentsQuery
        {
            ReferenceId = referenceId,
            OwnerModule = ownerModule,
            DocumentType = documentType,
            FileName = fileName,
            FileNameOperator = fileNameOperator,
            MinFileSizeBytes = minFileSizeBytes,
            MaxFileSizeBytes = maxFileSizeBytes,
            Extension = extension,
            ExtensionOperator = extensionOperator,
            ExpiryDateStart = expiryDateStart,
            ExpiryDateEnd = expiryDateEnd,
            UploadDateStart = uploadDateStart,
            UploadDateEnd = uploadDateEnd,
            IsAvailable = isAvailable,
            QuickSearch = quickSearch,
            PageNumber = pageNumber,
            PageSize = pageSize
        }, ct);

        return Ok(result);
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
        [FromForm] DateTime? reminderDate,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is empty.");

        var command = new UploadDocumentCommand
        {
            FileStream = file.OpenReadStream(),
            FileName = file.FileName,
            FileLength = file.Length,
            ReferenceId = referenceId,
            OwnerModule = ownerModule,
            DocumentType = documentType,
            IssueDate = issueDate,
            ExpiryDate = expiryDate,
            ReminderDate = reminderDate
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
        [FromForm] DateTime? reminderDate,
        CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Chunk is empty.");

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
            ExpiryDate = expiryDate,
            ReminderDate = reminderDate
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
        var document = await Sender.Send(new GetDocumentByIdQuery { Id = id }, ct);

        var exists = await _storageService.FileExistsAsync(document.FilePath, ct);
        
        await Sender.Send(new UpdateDocumentAvailabilityCommand { Id = id, IsAvailable = exists }, ct);

        if (!exists)
        {
            return NotFound(new { message = "File is not available on disk." });
        }

        var stream = await _storageService.DownloadAsync(document.FilePath, ct);

        if (!_contentTypeProvider.TryGetContentType(document.FileName, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return File(stream, contentType, document.FileName);
    }
    
    /// <summary>Get document metadata.</summary>
    [HttpGet("{id:guid}")]
    [HasPermission("Documents.Read")]
    [ProducesResponseType(typeof(DocumentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DocumentDto>> GetDocument(Guid id, CancellationToken ct)
    {
        var document = await Sender.Send(new GetDocumentByIdQuery { Id = id }, ct);
        return Ok(document);
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
            return BadRequest("ID mismatch");

        await Sender.Send(command, ct);
        return NoContent();
    }

    /// <summary>Check and sync physical document integrity.</summary>
    [HttpPost("check-integrity")]
    [HasPermission("Documents.Update")]
    [ProducesResponseType(typeof(IntegrityCheckResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckIntegrity(CancellationToken ct)
    {
        var result = await Sender.Send(new CheckDocumentsIntegrityCommand(), ct);
        return Ok(result);
    }
}
