namespace SoftPMS.Application.Features.Auth.DTOs;

public record LoginRequestDto(
    string Username,
    string Password
);
