using MediatR;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Common.Models.Email;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Commands.TestEmailConnection;

public sealed class TestEmailConnectionCommandHandler(ICurrentUserService currentUserService, IEmailService emailService)
    : IRequestHandler<TestEmailConnectionCommand, TestEmailResultDto>
{
    public async Task<TestEmailResultDto> Handle(TestEmailConnectionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var userEmail = currentUserService.UserEmail;
            if (string.IsNullOrWhiteSpace(userEmail))
            {
                return new TestEmailResultDto { Success = false, Message = "Current user does not have an email address to send the test to." };
            }

            var emailBody = BuildTestEmailHtml(string.IsNullOrWhiteSpace(currentUserService.Username) ? "User" : currentUserService.Username);
            var emailMessage = new EmailMessage(
                to: userEmail,
                subject: "SoftPMS - Test Email Configuration",
                body: emailBody,
                isHtml: true);

            await emailService.TestConnectionAsync(
                request.SmtpHost,
                request.SmtpPort,
                request.SmtpUserName,
                request.SmtpPassword,
                request.SmtpEnableSsl,
                request.SenderName,
                request.SenderEmail,
                emailMessage,
                cancellationToken
            );

            return new TestEmailResultDto { Success = true, Message = "SMTP connection successful and test email sent." };
        }
        catch (Exception ex)
        {
            // Logging the exception would be good here, but for the response, we return an English message.
            return new TestEmailResultDto { Success = false, Message = "SMTP Connection Failed. Please verify your settings and try again. Ensure Host, Port, and Credentials are correct." };
        }
    }

    private static string BuildTestEmailHtml(string username)
    {
        return $$"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Test Email Configuration</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
                    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 24px; }
                    .logo { font-size: 24px; font-weight: 700; color: #4f46e5; }
                    .success-box { background-color: #dcfce7; color: #166534; padding: 16px; border-radius: 6px; margin: 24px 0; text-align: center; font-weight: 600; border: 1px solid #bbf7d0; }
                    .footer { font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">SoftPMS</div>
                    </div>
                    <h2>SMTP Configuration Test</h2>
                    <p>Hello,</p>
                    <p>This is a test email sent from your SoftPMS instance to verify the SMTP configuration.</p>
                    <div class="success-box">
                        ✓ Your SMTP configuration is working correctly!
                    </div>
                    <p>If you have received this email, you can safely save your SMTP settings in the system parameters.</p>
                    <div class="footer">
                        <p>&copy; 2026 SoftPMS. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """;
    }
}
