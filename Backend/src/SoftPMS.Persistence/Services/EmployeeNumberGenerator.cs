using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SoftPMS.Application.Common.Settings;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Persistence.Context;

namespace SoftPMS.Persistence.Services;

public class EmployeeNumberGenerator : IEmployeeNumberGenerator
{
    private readonly SoftPMSDbContext _context;
    private readonly IOptionsMonitor<EmployeeSettings> _employeeSettings;

    public EmployeeNumberGenerator(
        SoftPMSDbContext context,
        IOptionsMonitor<EmployeeSettings> employeeSettings)
    {
        _context = context;
        _employeeSettings = employeeSettings;
    }

    public async Task<string> GenerateNextEmployeeNumberAsync(CancellationToken cancellationToken = default)
    {
        var connection = _context.Database.GetDbConnection();
        
        bool wasOpen = connection.State == System.Data.ConnectionState.Open;
        if (!wasOpen)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT NEXT VALUE FOR EmployeeNoSequence;";
            
            // Execute the sequence generation
            var result = await command.ExecuteScalarAsync(cancellationToken);
            int nextSequenceValue = Convert.ToInt32(result);

            // Get current prefix from settings (using Monitor for live updates)
            var prefix = _employeeSettings.CurrentValue.EmployeeNoPrefix ?? "EMP";
            
            // Format as EMP-000001
            return $"{prefix}-{nextSequenceValue:D6}";
        }
        finally
        {
            if (!wasOpen)
            {
                await connection.CloseAsync();
            }
        }
    }
}
