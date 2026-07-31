using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;

using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Application.Features.Documents.Queries;

public sealed class GetDocumentsQueryHandler(
    IApplicationDbContext context, 
    IMapper mapper) : IRequestHandler<GetDocumentsQuery, PaginatedList<DocumentDto>>
{
    public async Task<PaginatedList<DocumentDto>> Handle(GetDocumentsQuery request, CancellationToken cancellationToken)
    {
        var query = context.Documents.AsNoTracking();

        if (request.ReferenceId.HasValue)
        {
            query = query.Where(d => d.ReferenceId == request.ReferenceId.Value);
        }

        if (request.OwnerModule.HasValue)
        {
            query = query.Where(d => d.OwnerModule == request.OwnerModule.Value);
        }

        if (request.DocumentType.HasValue)
        {
            query = query.Where(d => d.DocumentType == request.DocumentType.Value);
        }

        if (request.MinFileSizeBytes.HasValue)
        {
            query = query.Where(d => d.FileSizeBytes >= request.MinFileSizeBytes.Value);
        }

        if (request.MaxFileSizeBytes.HasValue)
        {
            query = query.Where(d => d.FileSizeBytes <= request.MaxFileSizeBytes.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.QuickSearch))
        {
            var qs = request.QuickSearch.ToLower();
            query = query.Where(d => d.FileName.ToLower().Contains(qs));
        }

        if (!string.IsNullOrWhiteSpace(request.FileName))
        {
            var fileName = request.FileName.ToLower();
            if (request.FileNameOperator == "equals")
                query = query.Where(d => d.FileName.ToLower() == fileName);
            else if (request.FileNameOperator == "startswith")
                query = query.Where(d => d.FileName.ToLower().StartsWith(fileName));
            else if (request.FileNameOperator == "endswith")
                query = query.Where(d => d.FileName.ToLower().EndsWith(fileName));
            else // contains or default
                query = query.Where(d => d.FileName.ToLower().Contains(fileName));
        }

        if (!string.IsNullOrWhiteSpace(request.Extension))
        {
            if (request.ExtensionOperator == "equals")
            {
                var extValue = request.Extension.ToLower();
                if (!extValue.StartsWith(".")) extValue = "." + extValue;
                query = query.Where(d => d.FileName.ToLower().EndsWith(extValue));
            }
            else if (request.ExtensionOperator == "contains")
            {
                var extValue = request.Extension.ToLower();
                query = query.Where(d => d.FileName.ToLower().Contains(extValue));
            }
            else if (request.ExtensionOperator == "endswith")
            {
                var extValue = request.Extension.ToLower();
                if (!extValue.StartsWith(".")) extValue = "." + extValue;
                query = query.Where(d => d.FileName.ToLower().EndsWith(extValue));
            }
            else
            {
                var extensions = request.Extension.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                  .Select(e => e.Trim().StartsWith(".") ? e.Trim().ToLower() : "." + e.Trim().ToLower())
                                                  .ToList();

                if (request.ExtensionOperator == "is not")
                {
                    query = query.Where(d => !extensions.Any(ext => d.FileName.ToLower().EndsWith(ext)));
                }
                else
                {
                    query = query.Where(d => extensions.Any(ext => d.FileName.ToLower().EndsWith(ext)));
                }
            }
        }

        if (request.ExpiryDateStart.HasValue)
        {
            query = query.Where(d => d.ExpiryDate >= request.ExpiryDateStart.Value);
        }

        if (request.ExpiryDateEnd.HasValue)
        {
            query = query.Where(d => d.ExpiryDate <= request.ExpiryDateEnd.Value);
        }

        if (request.UploadDateStart.HasValue)
        {
            query = query.Where(d => d.CreatedAt >= request.UploadDateStart.Value);
        }

        if (request.UploadDateEnd.HasValue)
        {
            query = query.Where(d => d.CreatedAt <= request.UploadDateEnd.Value);
        }

        if (request.IsAvailable.HasValue)
        {
            query = query.Where(d => d.IsAvailable == request.IsAvailable.Value);
        }

        var projectedQuery = query
            .OrderByDescending(d => d.CreatedAt)
            .ProjectTo<DocumentDto>(mapper.ConfigurationProvider);

        return await PaginatedList<DocumentDto>.CreateAsync(
            projectedQuery,
            request.PageNumber,
            request.PageSize,
            cancellationToken);
    }
}
