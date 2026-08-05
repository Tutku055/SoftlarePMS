using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Application.Features.Notifications.Configurations;
using SoftPMS.Application.Features.Notifications.DTOs;

namespace SoftPMS.Application.Features.Notifications.Queries.GetNotificationSettings;

public class GetNotificationSettingsQueryHandler : IRequestHandler<GetNotificationSettingsQuery, List<NotificationTypeSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetNotificationSettingsQueryHandler(
        IApplicationDbContext context,
        IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<NotificationTypeSettingDto>> Handle(
        GetNotificationSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var settings = await _context.NotificationTypeSettings
            .AsNoTracking()
            .OrderBy(s => s.Type)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<NotificationTypeSettingDto>>(settings);

        // Enrich with static registry metadata (e.g. SupportedPlaceholders)
        foreach (var dto in dtos)
        {
            var def = NotificationRegistry.GetDefinition(dto.Type);
            if (def != null)
            {
                dto.SupportedPlaceholders = def.SupportedPlaceholders;
            }
        }

        return dtos;
    }
}
