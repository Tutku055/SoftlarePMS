using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.DTOs;
using SoftPMS.Application.Features.Notifications.Services;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Features.Notifications.Commands.AdjustNotificationThreshold;

public class AdjustNotificationThresholdCommandHandler : IRequestHandler<AdjustNotificationThresholdCommand, NotificationTypeSettingDto>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPassiveNotificationEvaluator _evaluator;

    public AdjustNotificationThresholdCommandHandler(
        IApplicationDbContext context,
        IMapper mapper,
        IPassiveNotificationEvaluator evaluator)
    {
        _context = context;
        _mapper = mapper;
        _evaluator = evaluator;
    }

    public async Task<NotificationTypeSettingDto> Handle(
        AdjustNotificationThresholdCommand request,
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
                IsMuted = definition?.DefaultIsMuted ?? false,
                ReminderDays = request.ReminderDays,
                DeliveryChannel = request.DeliveryChannel,
                UpdatedAt = DateTime.UtcNow
            };
            _context.NotificationTypeSettings.Add(setting);
        }
        else
        {
            setting.ReminderDays = request.ReminderDays;
            setting.DeliveryChannel = request.DeliveryChannel;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        // Immediately evaluate passive notifications and stage outbox emails if channel was changed to SystemAndMail
        await _evaluator.EvaluateAllAsync(cancellationToken);

        var dto = _mapper.Map<NotificationTypeSettingDto>(setting);
        if (definition != null)
        {
            dto.SupportedPlaceholders = definition.SupportedPlaceholders;
            dto.RequiredPermissions = definition.RequiredPermissions;
        }

        return dto;
    }
}
