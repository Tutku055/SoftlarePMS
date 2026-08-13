using MediatR;
using SoftPMS.Application.Features.Auth.DTOs;

namespace SoftPMS.Application.Features.Auth.Commands.RefreshToken;

/// <summary>
/// Represents the Command to refresh token.
/// </summary>
public sealed record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken
) : IRequest<JwtTokenResponseDto>;


