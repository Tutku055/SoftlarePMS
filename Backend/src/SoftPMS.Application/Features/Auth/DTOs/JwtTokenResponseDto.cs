namespace SoftPMS.Application.Features.Auth.DTOs;

public record JwtTokenResponseDto(
    string AccessToken,
    string RefreshToken
);
