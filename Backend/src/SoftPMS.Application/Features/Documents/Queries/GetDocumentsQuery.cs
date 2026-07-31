using MediatR;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Queries;

public class GetDocumentsQuery : IRequest<PaginatedList<DocumentDto>>
{
    public Guid? ReferenceId { get; set; }
    public DocumentModule? OwnerModule { get; set; }
    public DocumentType? DocumentType { get; set; }
    public string? FileName { get; set; }
    public string? FileNameOperator { get; set; }
    public long? MinFileSizeBytes { get; set; }
    public long? MaxFileSizeBytes { get; set; }
    public string? Extension { get; set; }
    public string? ExtensionOperator { get; set; }
    public DateTime? ExpiryDateStart { get; set; }
    public DateTime? ExpiryDateEnd { get; set; }
    public DateTime? UploadDateStart { get; set; }
    public DateTime? UploadDateEnd { get; set; }
    public bool? IsAvailable { get; set; }
    public string? QuickSearch { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
