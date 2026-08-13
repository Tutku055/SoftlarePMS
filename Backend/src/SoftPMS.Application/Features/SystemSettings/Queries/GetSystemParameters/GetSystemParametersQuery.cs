using MediatR;
using SoftPMS.Application.Features.SystemSettings.DTOs;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetSystemParameters;

/// <summary>
/// Represents the Query to get system parameters.
/// </summary>
public class GetSystemParametersQuery : IRequest<SystemParametersDto>
{
}


