namespace SoftPMS.Application.Features.SystemSettings.DTOs;

public record TestEmailResultDto
{
    public bool Success { get; init; }
    public string Message { get; init; } = string.Empty;
}
