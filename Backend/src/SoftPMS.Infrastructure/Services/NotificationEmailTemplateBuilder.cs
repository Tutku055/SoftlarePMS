using System.Net;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Infrastructure.Services;

public class NotificationEmailTemplateBuilder : INotificationEmailTemplateBuilder
{
    public string BuildNotificationEmailHtml(UserNotification notification, string recipientName)
    {
        var safeRecipient = WebUtility.HtmlEncode(recipientName);
        var safeTitle = WebUtility.HtmlEncode(notification.Title);
        var safeMessage = WebUtility.HtmlEncode(notification.Message);
        var safeType = WebUtility.HtmlEncode(notification.Type.ToString());

        var targetDateRow = notification.TargetDate.HasValue
            ? $@"
            <tr>
                <td style=""padding: 8px 0; color: #64748b; font-size: 14px;"">Target Date:</td>
                <td style=""padding: 8px 0; color: #1e293b; font-weight: 600; font-size: 14px; text-align: right;"">
                    {notification.TargetDate.Value:MMMM dd, yyyy}
                </td>
            </tr>"
            : string.Empty;

        var remainingDaysRow = notification.RemainingDays.HasValue
            ? $@"
            <tr>
                <td style=""padding: 8px 0; color: #64748b; font-size: 14px;"">Remaining Days:</td>
                <td style=""padding: 8px 0; color: #0284c7; font-weight: 600; font-size: 14px; text-align: right;"">
                    {(notification.RemainingDays.Value >= 0 ? $"{notification.RemainingDays.Value} days" : $"{Math.Abs(notification.RemainingDays.Value)} days overdue")}
                </td>
            </tr>"
            : string.Empty;

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{safeTitle}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 32px 36px;
            text-align: left;
        }}
        .header h1 {{
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }}
        .header .subtitle {{
            color: #94a3b8;
            font-size: 13px;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        .body-content {{
            padding: 36px;
        }}
        .greeting {{
            font-size: 16px;
            color: #475569;
            margin-bottom: 20px;
        }}
        .badge {{
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 12px;
        }}
        .notification-card {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #0284c7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }}
        .notification-title {{
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 10px 0;
        }}
        .notification-message {{
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
            margin: 0;
        }}
        .metadata-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
        }}
        .footer {{
            background-color: #f1f5f9;
            padding: 24px 36px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>SoftPMS</h1>
            <div class=""subtitle"">System Notification</div>
        </div>
        <div class=""body-content"">
            <div class=""greeting"">Hello <strong>{safeRecipient}</strong>,</div>
            <div class=""badge"">{safeType}</div>
            
            <div class=""notification-card"">
                <div class=""notification-title"">{safeTitle}</div>
                <div class=""notification-message"">{safeMessage}</div>

                <table class=""metadata-table"">
                    {targetDateRow}
                    {remainingDaysRow}
                </table>
            </div>

            <p style=""font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 24px;"">
                This is an automated passive notification generated by the SoftPMS platform according to your organization's monitoring rules.
            </p>
        </div>
        <div class=""footer"">
            &copy; {DateTime.UtcNow.Year} SoftPMS &bull; All rights reserved.
        </div>
    </div>
</body>
</html>";
    }
}
