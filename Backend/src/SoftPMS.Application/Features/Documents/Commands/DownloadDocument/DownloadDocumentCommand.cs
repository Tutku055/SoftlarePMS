using MediatR;
using SoftPMS.Application.Features.Documents.DTOs;

namespace SoftPMS.Application.Features.Documents.Commands.DownloadDocument;

public record DownloadDocumentCommand(Guid Id) : IRequest<DocumentDownloadDto?>;
