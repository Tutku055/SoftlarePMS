using MediatR;
using System.ComponentModel.DataAnnotations;

namespace SoftPMS.Application.Features.Users.Commands.ChangePassword;

/// <summary>
/// Represents the Command to change password.
/// </summary>
public sealed record ChangePasswordCommand(
    Guid UserId,
    [Required] string OldPassword,
    [Required] string NewPassword
) : IRequest<Unit>;


