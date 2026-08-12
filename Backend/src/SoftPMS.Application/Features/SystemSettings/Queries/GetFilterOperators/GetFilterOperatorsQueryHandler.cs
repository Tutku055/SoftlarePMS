using MediatR;
using SoftPMS.Application.Common.Constants;
using SoftPMS.Application.Features.SystemSettings.DTOs;
using System.Threading;
using System.Threading.Tasks;

namespace SoftPMS.Application.Features.SystemSettings.Queries.GetFilterOperators;

public class GetFilterOperatorsQueryHandler : IRequestHandler<GetFilterOperatorsQuery, FilterOperatorsDto>
{
    public Task<FilterOperatorsDto> Handle(GetFilterOperatorsQuery request, CancellationToken cancellationToken)
    {
        var result = new FilterOperatorsDto
        {
            StringOperators = FilterOperatorConstants.StringOperators,
            FullNameOperators = FilterOperatorConstants.FullNameOperators,
            DateOperators = FilterOperatorConstants.DateOperators,
            NumberOperators = FilterOperatorConstants.NumberOperators,
            FileSizeOperators = FilterOperatorConstants.FileSizeOperators,
            SelectOperators = FilterOperatorConstants.SelectOperators,
            MultiSelectOperators = FilterOperatorConstants.MultiSelectOperators
        };

        return Task.FromResult(result);
    }
}
