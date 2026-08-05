namespace SoftPMS.Domain.Enums;

/// <summary>
/// Status states for the Transactional Outbox message lifecycle.
/// </summary>
public enum OutboxStatus
{
    /// <summary>Message is written to DB within transaction, waiting for worker processing.</summary>
    Pending = 0,

    /// <summary>Worker has picked up the message and is actively transmitting via SMTP/API.</summary>
    Processing = 1,

    /// <summary>Message was successfully delivered by the email service provider.</summary>
    Sent = 2,

    /// <summary>Delivery failed. Eligible for retry if RetryCount &lt; MaxRetries; otherwise Dead-Letter/Final-Fail.</summary>
    Failed = 3
}
