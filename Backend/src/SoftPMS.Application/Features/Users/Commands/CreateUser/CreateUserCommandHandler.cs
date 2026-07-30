using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Exceptions;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Users.DTOs;
using SoftPMS.Domain.Entities;
using BCrypt.Net;

namespace SoftPMS.Application.Features.Users.Commands.CreateUser;

public sealed class CreateUserCommandHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<CreateUserCommand, UserDto>
{
    public async Task<UserDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var normalizedUsername = request.Dto.Username.Trim().ToLower();
        var exists = await context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);
        if (exists)
            throw new Domain.Exceptions.DomainException($"Username '{request.Dto.Username}' is already taken.");

        var normalizedEmail = request.Dto.Email.Trim().ToLower();
        exists = await context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (exists)
            throw new Domain.Exceptions.DomainException($"Email '{request.Dto.Email}' is already taken.");

        var role = await context.Roles.FirstOrDefaultAsync(r => r.Id == request.Dto.RoleId, cancellationToken);
        if (role == null)
            throw new Domain.Exceptions.NotFoundException(nameof(Role), request.Dto.RoleId);
        
        if (role.Name == "SuperAdmin")
            throw new Domain.Exceptions.DomainException("Users cannot be created with the Super Admin role.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            EmployeeId = request.Dto.EmployeeId,
            Username = request.Dto.Username.Trim(),
            Email = request.Dto.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Dto.Password),
            RoleId = request.Dto.RoleId,
            IsActive = request.Dto.IsActive,
            RequiresPasswordChange = true
        };

        await context.Users.AddAsync(user, cancellationToken);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            if (ex.InnerException?.Message.Contains("IX_Users_Email") == true || ex.Message.Contains("IX_Users_Email"))
            {
                throw new Domain.Exceptions.DomainException($"Email '{request.Dto.Email}' is already taken.");
            }
            if (ex.InnerException?.Message.Contains("IX_Users_Username") == true || ex.Message.Contains("IX_Users_Username"))
            {
                throw new Domain.Exceptions.DomainException($"Username '{request.Dto.Username}' is already taken.");
            }
            throw;
        }

        return mapper.Map<UserDto>(user);
    }
}
