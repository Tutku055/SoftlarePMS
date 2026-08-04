using SoftPMS.Application.Common.Models.Email;

namespace SoftPMS.Application.Common.Interfaces;

/// <summary>
/// Contract for sending single and bulk transactional emails.
/// </summary>
public interface IEmailService
{
    /// <summary>Sends a single email message asynchronously.</summary>
    Task SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default);

    /// <summary>Convenience overload to send a single email with basic parameters.</summary>
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default);

    /// <summary>Sends multiple email messages in batch asynchronously using an optimized connection session.</summary>
    Task SendEmailsAsync(IEnumerable<EmailMessage> messages, CancellationToken cancellationToken = default);
}
