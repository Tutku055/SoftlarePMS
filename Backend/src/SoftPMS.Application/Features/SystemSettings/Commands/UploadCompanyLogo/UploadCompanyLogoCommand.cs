using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;

namespace SoftPMS.Application.Features.SystemSettings.Commands.UploadCompanyLogo;

public record UploadCompanyLogoCommand : IRequest<string>
{
    public Stream FileStream { get; init; } = null!;
    public string FileName { get; init; } = string.Empty;
}
