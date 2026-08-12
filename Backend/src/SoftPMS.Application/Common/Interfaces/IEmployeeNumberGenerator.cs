namespace SoftPMS.Application.Common.Interfaces;

public interface IEmployeeNumberGenerator
{
    Task<string> GenerateNextEmployeeNumberAsync(CancellationToken cancellationToken = default);
}
