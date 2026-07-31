using MediatR;

namespace SoftPMS.Application.Features.SystemSettings.Queries.CheckYearClosure;

public record CheckYearClosureQuery(int Year) : IRequest<bool>;
