using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Notifications.Commands.ToggleNotificationMute;

public class ToggleNotificationMuteCommandHandler : IRequestHandler<ToggleNotificationMuteCommand, NotificationTypeSettingDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ToggleNotificationMuteCommandHandler(
        IApplicationDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<NotificationTypeSettingDto> Handle(
        ToggleNotificationMuteCommand request,
        CancellationToken cancellationToken)
    {
        var setting = await _context.NotificationTypeSettings
            .FirstOrDefaultAsync(s => s.Type == request.Type, cancellationToken);

        var definition = NotificationRegistry.GetDefinition(request.Type);

        if (setting == null)
        {
            setting = new NotificationTypeSetting
            {
                Type = request.Type,
                TypeName = definition?.TypeName ?? request.Type.ToString(),
                Description = definition?.Description ?? string.Empty,
                IsMuted = request.IsMuted,
                ReminderDays = definition?.DefaultReminderDays ?? 7,
                DeliveryChannel = definition?.DefaultDeliveryChannel ?? Domain.Enums.NotificationDeliveryChannel.System,
                UpdatedAt = DateTime.UtcNow
            };
            _context.NotificationTypeSettings.Add(setting);
        }
        else
        {
            setting.IsMuted = request.IsMuted;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var dto = _mapper.Map<NotificationTypeSettingDto>(setting);
        if (definition != null)
        {
            dto.SupportedPlaceholders = definition.SupportedPlaceholders;
        }

        return dto;
    }
}
