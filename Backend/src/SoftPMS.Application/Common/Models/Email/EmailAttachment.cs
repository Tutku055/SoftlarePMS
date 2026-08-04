namespace SoftPMS.Application.Common.Models.Email;

public sealed class EmailAttachment
{
    public string FileName { get; init; } = string.Empty;
    public byte[] Content { get; init; } = [];
    public string ContentType { get; init; } = "application/octet-stream";

    public EmailAttachment()
    {
    }

    public EmailAttachment(string fileName, byte[] content, string contentType = "application/octet-stream")
    {
        FileName = fileName;
        Content = content;
        ContentType = contentType;
    }
}
