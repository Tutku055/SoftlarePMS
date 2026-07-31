using MediatR;
using SoftPMS.Application.Features.OvertimeTypes.DTOs;

namespace SoftPMS.Application.Features.OvertimeTypes.Queries.GetOvertimeTypes;

public record GetOvertimeTypesQuery(bool IncludeDeleted = false) : IRequest<List<OvertimeTypeDto>>;
