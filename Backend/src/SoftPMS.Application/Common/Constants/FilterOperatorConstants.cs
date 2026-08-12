using System.Collections.Generic;

namespace SoftPMS.Application.Common.Constants;

public static class FilterOperatorConstants
{
    public static readonly List<FilterOperatorItem> StringOperators = new()
    {
        new("contains", "Contains"),
        new("equals", "Equals"),
        new("startswith", "Starts with"),
        new("endswith", "Ends with")
    };

    public static readonly List<FilterOperatorItem> FullNameOperators = new()
    {
        new("contains", "Contains"),
        new("firstName", "First Name"),
        new("lastName", "Last Name")
    };

    public static readonly List<FilterOperatorItem> DateOperators = new()
    {
        new("is", "Is"),
        new("after", "After"),
        new("before", "Before")
    };

    public static readonly List<FilterOperatorItem> NumberOperators = new()
    {
        new("is", "Is"),
        new("morethan", "More than"),
        new("lessthan", "Less than")
    };

    public static readonly List<FilterOperatorItem> FileSizeOperators = new()
    {
        new("biggerthan", "Bigger than"),
        new("smallerthan", "Smaller than")
    };

    public static readonly List<FilterOperatorItem> SelectOperators = new()
    {
        new("is", "Is"),
        new("not", "Is Not")
    };

    public static readonly List<FilterOperatorItem> MultiSelectOperators = new()
    {
        new("in", "In"),
        new("notin", "Not In")
    };
}

public record FilterOperatorItem(string Value, string Label);
