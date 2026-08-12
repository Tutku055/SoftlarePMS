using SoftPMS.Application.Common.Constants;
using System.Collections.Generic;

namespace SoftPMS.Application.Features.SystemSettings.DTOs;

public class FilterOperatorsDto
{
    public List<FilterOperatorItem> StringOperators { get; set; } = new();
    public List<FilterOperatorItem> FullNameOperators { get; set; } = new();
    public List<FilterOperatorItem> DateOperators { get; set; } = new();
    public List<FilterOperatorItem> NumberOperators { get; set; } = new();
    public List<FilterOperatorItem> FileSizeOperators { get; set; } = new();
    public List<FilterOperatorItem> SelectOperators { get; set; } = new();
    public List<FilterOperatorItem> MultiSelectOperators { get; set; } = new();
}
