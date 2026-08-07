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

    public string BuildBirthdayCelebrantEmailHtml(string celebrantFirstName)
    {
        var safeFirstName = WebUtility.HtmlEncode(celebrantFirstName);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Happy Birthday, {safeFirstName}! 🎉</title>
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
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.15);
            border: 1px solid #e0e7ff;
        }}
        .header {{
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
            padding: 48px 36px 36px 36px;
            text-align: center;
            color: #ffffff;
        }}
        .header-icon {{
            font-size: 54px;
            margin-bottom: 12px;
            display: inline-block;
        }}
        .header h1 {{
            color: #ffffff;
            font-size: 26px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }}
        .header .subtitle {{
            color: #fbcfe8;
            font-size: 14px;
            font-weight: 500;
            margin-top: 8px;
            letter-spacing: 0.5px;
        }}
        .body-content {{
            padding: 40px 36px;
            text-align: center;
        }}
        .celebration-card {{
            background: linear-gradient(180deg, #fdf4ff 0%, #f5f3ff 100%);
            border: 1px solid #e9d5ff;
            border-radius: 12px;
            padding: 28px 24px;
            margin: 10px 0 28px 0;
        }}
        .celebration-text {{
            font-size: 16px;
            line-height: 1.7;
            color: #334155;
            margin: 0;
        }}
        .wishes-highlight {{
            font-size: 18px;
            font-weight: 700;
            color: #6b21a8;
            margin-bottom: 12px;
        }}
        .badge {{
            display: inline-block;
            background-color: #fdf2f8;
            color: #db2777;
            font-size: 13px;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 9999px;
            border: 1px solid #fbcfe8;
            margin-bottom: 20px;
        }}
        .footer {{
            background-color: #faf5ff;
            padding: 24px 36px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f3e8ff;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <div class=""header-icon"">🎂 🎉 🎈</div>
            <h1>Happy Birthday, {safeFirstName}!</h1>
            <div class=""subtitle"">Best Wishes From Your Team at SoftPMS</div>
        </div>
        <div class=""body-content"">
            <div class=""badge"">🌟 Celebrating You Today!</div>
            
            <div class=""celebration-card"">
                <div class=""wishes-highlight"">Wishing you an extraordinary year ahead!</div>
                <p class=""celebration-text"">
                    On behalf of everyone at SoftPMS, we wish you a very happy birthday filled with joy, health, and memorable celebrations! 
                    <br><br>
                    Thank you for bringing your dedication, creativity, and great energy to our team every single day. Here's to another wonderful year of success and happiness!
                </p>
            </div>

            <p style=""font-size: 14px; color: #64748b; margin-top: 20px;"">
                Have a wonderful day and enjoy your special celebration! 🥳
            </p>
        </div>
        <div class=""footer"">
            &copy; {DateTime.UtcNow.Year} SoftPMS &bull; Making Teams Happier Together
        </div>
    </div>
</body>
</html>";
    }

    public string BuildBirthdayColleagueAnnouncementEmailHtml(string celebrantFullName, string recipientName)
    {
        var safeCelebrant = WebUtility.HtmlEncode(celebrantFullName);
        var safeRecipient = WebUtility.HtmlEncode(recipientName);

        return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Today is {safeCelebrant}'s Birthday! 🎂</title>
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
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #0284c7 0%, #6366f1 100%);
            padding: 32px 36px;
            text-align: left;
            color: #ffffff;
        }}
        .header h1 {{
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }}
        .header .subtitle {{
            color: #bae6fd;
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
            margin-bottom: 16px;
        }}
        .badge {{
            display: inline-block;
            background-color: #f0fdf4;
            color: #16a34a;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid #bbf7d0;
            margin-bottom: 16px;
        }}
        .announcement-card {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 4px solid #6366f1;
            border-radius: 8px;
            padding: 24px 20px;
            margin: 16px 0;
        }}
        .announcement-title {{
            font-size: 18px;
            font-weight: 700;
            color: #1e1b4b;
            margin: 0 0 10px 0;
        }}
        .announcement-message {{
            font-size: 15px;
            line-height: 1.6;
            color: #334155;
            margin: 0;
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
            <div class=""subtitle"">Team Milestone &bull; Celebration</div>
        </div>
        <div class=""body-content"">
            <div class=""greeting"">Hello <strong>{safeRecipient}</strong>,</div>
            <div class=""badge"">🎂 Team Celebration</div>
            
            <div class=""announcement-card"">
                <div class=""announcement-title"">Today is {safeCelebrant}'s Birthday! 🎉</div>
                <p class=""announcement-message"">
                    Today is our colleague <strong>{safeCelebrant}</strong>'s special day! 🎈
                    <br><br>
                    Please take a moment today to reach out, say happy birthday, and share your warmest wishes to make their day extra joyful and memorable!
                </p>
            </div>

            <p style=""font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 24px;"">
                This is an automated celebratory notification from SoftPMS. Let's celebrate our team together!
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
