using System.ComponentModel.DataAnnotations;

namespace SoftPMS.Infrastructure.Settings;

public sealed class EmailSettings
{
    [Required]
    public string Host { get; init; } = "localhost";

    [Range(1, 65535)]
    public int Port { get; init; } = 1025;

    [Required]
    public string FromName { get; init; } = "SoftPMS";

    [Required, EmailAddress]
    public string FromEmail { get; init; } = "no-reply@softpms.com";

    public string? UserName { get; init; }

    public string? Password { get; init; }

    public bool EnableSsl { get; init; } = false;
}
