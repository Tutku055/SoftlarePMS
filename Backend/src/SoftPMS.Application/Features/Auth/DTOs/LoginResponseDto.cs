namespace SoftPMS.Application.Features.Auth.DTOs;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiration,
    string Username,
    string Email,
    bool RequiresPasswordChange
);
