using MediatR;
using SoftPMS.Application.Features.Documents.DTOs;

namespace SoftPMS.Application.Features.Documents.Commands.DownloadDocument;

/// <summary>
/// Represents the Command to download document.
/// </summary>
public record DownloadDocumentCommand(Guid Id) : IRequest<DocumentDownloadDto?>;


