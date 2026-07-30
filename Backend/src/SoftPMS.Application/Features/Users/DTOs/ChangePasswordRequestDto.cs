namespace SoftPMS.Application.Features.Users.DTOs;

/// <summary>Request body for the change-password endpoint.</summary>
public sealed record ChangePasswordRequestDto(string OldPassword, string NewPassword);
