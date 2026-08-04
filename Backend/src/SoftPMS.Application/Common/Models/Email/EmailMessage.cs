namespace SoftPMS.Application.Common.Models.Email;

public sealed class EmailMessage
{
    public List<string> To { get; init; } = [];
    public List<string> Cc { get; init; } = [];
    public List<string> Bcc { get; init; } = [];
    public string Subject { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public bool IsHtml { get; init; } = true;
    public List<EmailAttachment> Attachments { get; init; } = [];

    public EmailMessage()
    {
    }

    public EmailMessage(string to, string subject, string body, bool isHtml = true)
    {
        if (!string.IsNullOrWhiteSpace(to))
        {
            To.Add(to);
        }
        Subject = subject;
        Body = body;
        IsHtml = isHtml;
    }

    public EmailMessage(IEnumerable<string> to, string subject, string body, bool isHtml = true)
    {
        if (to != null)
        {
            To.AddRange(to);
        }
        Subject = subject;
        Body = body;
        IsHtml = isHtml;
    }
}
