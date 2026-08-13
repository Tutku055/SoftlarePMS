using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;

public class GetSystemParametersQuery : IRequest<SystemParametersDto>
{
}
