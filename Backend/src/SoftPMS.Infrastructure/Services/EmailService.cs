using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models.Email;
using SoftPMS.Infrastructure.Settings;

namespace SoftPMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        var mimeMessage = BuildMimeMessage(message);

        using var client = await CreateConnectedSmtpClientAsync(cancellationToken);
        try
        {
            await client.SendAsync(mimeMessage, cancellationToken);
            _logger.LogInformation("Email successfully sent to {Recipients}. Subject: {Subject}",
                string.Join(", ", message.To), message.Subject);
        }
        finally
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
    }

    public Task SendEmailAsync(string to, string subject, string body, bool isHtml = true, CancellationToken cancellationToken = default)
    {
        var message = new EmailMessage(to, subject, body, isHtml);
        return SendEmailAsync(message, cancellationToken);
    }

    public async Task SendEmailsAsync(IEnumerable<EmailMessage> messages, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(messages);

        var messageList = messages.ToList();
        if (messageList.Count == 0)
        {
            return;
        }

        using var client = await CreateConnectedSmtpClientAsync(cancellationToken);
        try
        {
            foreach (var message in messageList)
            {
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var mimeMessage = BuildMimeMessage(message);
                    await client.SendAsync(mimeMessage, cancellationToken);
                    _logger.LogInformation("Batch email sent to {Recipients}. Subject: {Subject}",
                        string.Join(", ", message.To), message.Subject);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send batch email to {Recipients}. Subject: {Subject}",
                        string.Join(", ", message.To), message.Subject);
                    throw;
                }
            }
        }
        finally
        {
            await client.DisconnectAsync(true, cancellationToken);
        }
    }

    private async Task<SmtpClient> CreateConnectedSmtpClientAsync(CancellationToken cancellationToken)
    {
        var client = new SmtpClient();
        var socketOptions = _settings.EnableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;

        await client.ConnectAsync(_settings.Host, _settings.Port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(_settings.UserName) && !string.IsNullOrWhiteSpace(_settings.Password))
        {
            await client.AuthenticateAsync(_settings.UserName, _settings.Password, cancellationToken);
        }

        return client;
    }

    private MimeMessage BuildMimeMessage(EmailMessage message)
    {
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(_settings.FromName, _settings.FromEmail));

        foreach (var to in message.To.Where(t => !string.IsNullOrWhiteSpace(t)))
        {
            mimeMessage.To.Add(MailboxAddress.Parse(to));
        }

        foreach (var cc in message.Cc.Where(c => !string.IsNullOrWhiteSpace(c)))
        {
            mimeMessage.Cc.Add(MailboxAddress.Parse(cc));
        }

        foreach (var bcc in message.Bcc.Where(b => !string.IsNullOrWhiteSpace(b)))
        {
            mimeMessage.Bcc.Add(MailboxAddress.Parse(bcc));
        }

        mimeMessage.Subject = message.Subject;

        var builder = new BodyBuilder();
        if (message.IsHtml)
        {
            builder.HtmlBody = message.Body;
        }
        else
        {
            builder.TextBody = message.Body;
        }

        foreach (var attachment in message.Attachments)
        {
            if (attachment.Content != null && attachment.Content.Length > 0)
            {
                builder.Attachments.Add(attachment.FileName, attachment.Content, ContentType.Parse(attachment.ContentType));
            }
        }

        mimeMessage.Body = builder.ToMessageBody();
        return mimeMessage;
    }
}
