using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Caching.Memory;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models.Email;
using SoftPMS.Infrastructure.Settings;

namespace SoftPMS.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<EmailService> _logger;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public EmailService(IServiceScopeFactory scopeFactory, IMemoryCache memoryCache, ILogger<EmailService> logger, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _memoryCache = memoryCache;
        _logger = logger;
        _configuration = configuration;
    }

    private async Task<SoftPMS.Application.Features.SystemSettings.DTOs.SystemParametersDto> GetSystemParametersAsync(CancellationToken ct)
    {
        // Try cache first
        if (_memoryCache.TryGetValue("SystemSettings_CacheKey", out SoftPMS.Application.Features.SystemSettings.DTOs.SystemParametersDto? cached) && cached != null)
        {
            return cached;
        }

        // Fallback to DB
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var settings = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(dbContext.SystemSettings, ct);
        
        if (settings == null)
            return new SoftPMS.Application.Features.SystemSettings.DTOs.SystemParametersDto(); // Defaults

        return new SoftPMS.Application.Features.SystemSettings.DTOs.SystemParametersDto 
        { 
            CompanyName = settings.CompanyName ?? string.Empty,
            CompanyLogoPath = settings.CompanyLogoPath ?? string.Empty,
            SmtpHost = settings.SmtpHost ?? "localhost", 
            SmtpPort = settings.SmtpPort, 
            SenderName = settings.SenderName ?? string.Empty, 
            SenderEmail = settings.SenderEmail ?? string.Empty, 
            SmtpUserName = settings.SmtpUserName ?? string.Empty, 
            SmtpPassword = settings.SmtpPassword ?? string.Empty, 
            SmtpEnableSsl = settings.SmtpEnableSsl 
        };
    }

    private string GetHtmlTemplate(string body, string companyName, string companyLogoPath, string subject)
    {
        var safeCompanyName = string.IsNullOrWhiteSpace(companyName) ? "Softlare PMS" : companyName;
        
        string logoUrl = "";
        if (!string.IsNullOrWhiteSpace(companyLogoPath))
        {
            if (companyLogoPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                logoUrl = companyLogoPath;
            }
            else
            {
                var apiUrl = _configuration["ApiUrl"]?.TrimEnd('/') ?? "https://localhost:7219";
                logoUrl = $"{apiUrl}/api/Vault/{companyLogoPath.TrimStart('/')}";
            }
        }

        var logoHtml = !string.IsNullOrWhiteSpace(logoUrl) 
            ? $"<img src=\"{logoUrl}\" alt=\"{safeCompanyName} Logo\" style=\"max-height: 40px; display: block; margin: 0 auto;\" />"
            : "";

        var template = @"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{{SUBJECT}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
        .body-content { padding: 36px; }
        .footer { background-color: #f1f5f9; padding: 24px 36px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class=""container"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"" border=""0"" style=""background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);"">
            <tr>
                <td style=""padding: 24px 36px; text-align: left; vertical-align: middle; width: 60%;"">
                    <h1 style=""color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; font-family: sans-serif;"">SoftPMS</h1>
                    <div style=""color: #94a3b8; font-size: 13px; margin-top: 6px; text-transform: uppercase; font-family: sans-serif; letter-spacing: 1px;"">System Notification</div>
                </td>
                <td style=""padding: 24px 36px; text-align: right; vertical-align: middle; width: 40%;"">
                    <div style=""display: inline-block; text-align: center; max-width: 160px;"">
                        {{LOGO_HTML}}
                        <div style=""color: #cbd5e1; font-size: 11px; margin-top: 6px; font-weight: 600; font-family: sans-serif; line-height: 1.4; max-height: 31px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; text-overflow: ellipsis; word-break: break-word;"">
                            {{COMPANY_NAME}}
                        </div>
                    </div>
                </td>
            </tr>
        </table>
        <div class=""body-content"">
            {{BODY}}
        </div>
        <div class=""footer"">
            &copy; {{YEAR}} {{COMPANY_NAME}}. All rights reserved.
        </div>
    </div>
</body>
</html>";

        return template
            .Replace("{{SUBJECT}}", subject)
            .Replace("{{LOGO_HTML}}", logoHtml)
            .Replace("{{COMPANY_NAME}}", safeCompanyName)
            .Replace("{{BODY}}", body)
            .Replace("{{YEAR}}", DateTime.UtcNow.Year.ToString());
    }

    public async Task SendEmailAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);

        var mimeMessage = await BuildMimeMessageAsync(message, cancellationToken);

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
                    var mimeMessage = await BuildMimeMessageAsync(message, cancellationToken);
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
        var settings = await GetSystemParametersAsync(cancellationToken);
        var client = new SmtpClient();
        var socketOptions = settings.SmtpEnableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;

        await client.ConnectAsync(settings.SmtpHost, settings.SmtpPort, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(settings.SmtpUserName) && !string.IsNullOrWhiteSpace(settings.SmtpPassword))
        {
            await client.AuthenticateAsync(settings.SmtpUserName, settings.SmtpPassword, cancellationToken);
        }

        return client;
    }

    private async Task<MimeMessage> BuildMimeMessageAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var settings = await GetSystemParametersAsync(cancellationToken);
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(settings.SenderName, settings.SenderEmail));

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
            builder.HtmlBody = GetHtmlTemplate(message.Body, settings.CompanyName, settings.CompanyLogoPath, message.Subject);
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

    public async Task TestConnectionAsync(string host, int port, string? userName, string? password, bool enableSsl, string senderName, string senderEmail, EmailMessage message, CancellationToken cancellationToken = default)
    {
        using var client = new SmtpClient();
        var socketOptions = enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;

        await client.ConnectAsync(host, port, socketOptions, cancellationToken);

        if (!string.IsNullOrWhiteSpace(userName) && !string.IsNullOrWhiteSpace(password))
        {
            await client.AuthenticateAsync(userName, password, cancellationToken);
        }

        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(senderName, senderEmail));
        
        foreach (var to in message.To.Where(t => !string.IsNullOrWhiteSpace(t)))
        {
            mimeMessage.To.Add(MailboxAddress.Parse(to));
        }

        mimeMessage.Subject = message.Subject;

        var builder = new BodyBuilder();
        if (message.IsHtml)
        {
            var settings = await GetSystemParametersAsync(cancellationToken);
            builder.HtmlBody = GetHtmlTemplate(message.Body, settings.CompanyName, settings.CompanyLogoPath, message.Subject);
        }
        else
        {
            builder.TextBody = message.Body;
        }
        
        mimeMessage.Body = builder.ToMessageBody();

        await client.SendAsync(mimeMessage, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
