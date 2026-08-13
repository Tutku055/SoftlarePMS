using MediatR;

namespace SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure;

/// <summary>
/// Represents the Query to check year closure.
/// </summary>
public record CheckYearClosureQuery(int Year) : IRequest<bool>;


