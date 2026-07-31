namespace SoftPMS.Application.Features.Documents.DTOs;

public class DocumentDownloadDto
{
    public Stream Stream { get; set; } = null!;
    public string FileName { get; set; } = null!;
}
