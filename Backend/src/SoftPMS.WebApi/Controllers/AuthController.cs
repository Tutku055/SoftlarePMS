using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftPMS.Application.Features.Auth.DTOs;
using SoftPMS.Application.Features.Auth.Commands.ForgotPassword;
using SoftPMS.Application.Features.Auth.Commands.Login;
using SoftPMS.Application.Features.Auth.Commands.RefreshToken;
using SoftPMS.Application.Features.Auth.Commands.ResetPassword;

namespace SoftPMS.WebApi.Controllers;

[AllowAnonymous]
public sealed class AuthController : ApiControllerBase
{
    /// <summary>Authenticate with username and password. Returns JWT access + refresh tokens.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>Exchange an expired access token and a valid refresh token for a new token pair.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(JwtTokenResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command, CancellationToken ct)
    {
        var result = await Sender.Send(command, ct);
        return Ok(result);
    }

    /// <summary>Initiates a password reset flow by sending a reset link to the given email.</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordCommand command, CancellationToken ct)
    {
        await Sender.Send(command, ct);
        return Ok(new { message = "If the email address exists in our system, a password reset link has been sent." });
    }

    /// <summary>Resets the user's password using the token received in the reset email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordCommand command, CancellationToken ct)
    {
        await Sender.Send(command, ct);
        return Ok(new { message = "Password has been successfully reset." });
    }
}
