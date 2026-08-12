using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SoftPMS.Application.Common.Interfaces;
using SoftPMS.Domain.Entities;
using SoftPMS.Domain.Enums;

namespace SoftPMS.Infrastructure.Persistence;

public class ApplicationDbContextInitialiser
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ApplicationDbContextInitialiser> _logger;

    public ApplicationDbContextInitialiser(IApplicationDbContext context, ILogger<ApplicationDbContextInitialiser> logger) //[cite: 1]
    {
        _context = context; //[cite: 1]
        _logger = logger; //[cite: 1]
    }

    public async Task SeedAsync() //[cite: 1]
    {
        try
        {
            // ONE-OFF FIX: If professions table is empty, generate 27 professions and assign to existing employees
            if (!await _context.Professions.AnyAsync())
            {
                _logger.LogInformation("Professions table is empty. Generating 27 professions...");
                
                var profFaker = new Faker<Profession>()
                    .RuleFor(p => p.Id, f => Guid.NewGuid())
                    .RuleFor(p => p.CreatedAt, f => f.Date.Past(3))
                    .RuleFor(p => p.Name, f => f.Name.JobTitle())
                    .RuleFor(p => p.Description, f => f.Lorem.Sentence(5))
                    .RuleFor(p => p.IsActive, f => true)
                    .RuleFor(p => p.IsDeleted, f => false);

                var generatedProfessions = profFaker.Generate(27);
                
                var rnd = new Bogus.Randomizer();
                var inactives = rnd.ArrayElements(generatedProfessions.ToArray(), 4);
                foreach (var ip in inactives)
                {
                    ip.IsActive = false;
                }

                await _context.Professions.AddRangeAsync(generatedProfessions);
                
                var activeProfs = generatedProfessions.Where(p => p.IsActive).ToList();
                var existingEmployees = await _context.Employees.ToListAsync();
                
                if (existingEmployees.Any())
                {
                    _logger.LogInformation("Assigning new active professions to {Count} existing employees...", existingEmployees.Count);
                    foreach (var emp in existingEmployees)
                    {
                        emp.ProfessionId = rnd.ListItem(activeProfs).Id;
                    }
                }
                
                await _context.SaveChangesAsync();
                _logger.LogInformation("Professions seeded and assigned successfully.");
            }

            // ONE-OFF FIX: If any existing employees have empty or null email, populate them with mock emails
            var employeesWithoutEmail = await _context.Employees
                .Where(e => string.IsNullOrWhiteSpace(e.Email))
                .ToListAsync();

            if (employeesWithoutEmail.Count > 0)
            {
                _logger.LogInformation("Found {Count} employees with empty email. Assigning random emails...", employeesWithoutEmail.Count);
                foreach (var emp in employeesWithoutEmail)
                {
                    var cleanFirst = new string((emp.FirstName ?? "emp").Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                    var cleanLast = new string((emp.LastName ?? "user").Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
                    if (string.IsNullOrWhiteSpace(cleanFirst)) cleanFirst = "employee";
                    if (string.IsNullOrWhiteSpace(cleanLast)) cleanLast = $"{emp.Id.ToString()[..4]}";
                    emp.Email = $"{cleanFirst}.{cleanLast}@softpms.com";
                }
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully assigned mock emails to {Count} existing employees.", employeesWithoutEmail.Count);
            }

            // Skip completely if Employee or Department already exists in the database (One-time rule) //[cite: 1]
            if (await _context.Employees.AnyAsync() || await _context.Departments.AnyAsync())
            {
                return; //[cite: 1]
            }

            var creatorUserId = Guid.Parse("69318b93-57c8-4a54-8aae-05eec7d4ba95"); //[cite: 1]

            // Check if a User with this ID exists in the database to avoid Foreign Key errors
            var creatorUserExists = await _context.Users.AnyAsync(u => u.Id == creatorUserId); //[cite: 1]

            if (!creatorUserExists) //[cite: 1]
            {
                _logger.LogWarning("Seeding canceled: User with ID '69318b93-57c8-4a54-8aae-05eec7d4ba95' not found in the database! You must add the user first."); //[cite: 1]
                return; //[cite: 1]
            }

            _logger.LogInformation("Generating 10 Departments and 100 fake employee records with Bogus...");

            // 1. Department Faker //[cite: 3]
            var departmentFaker = new Faker<Department>()
                .RuleFor(d => d.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(d => d.CreatedAt, f => f.Date.Past(3)) //[cite: 2]
                .RuleFor(d => d.Name, f => f.Commerce.Department()) //[cite: 3]
                .RuleFor(d => d.Description, f => f.Lorem.Sentence(5)); //[cite: 3]

            // Generate 10 Departments
            var fakeDepartments = departmentFaker.Generate(10);

            // 1.5 Profession Faker
            var professionFaker = new Faker<Profession>()
                .RuleFor(p => p.Id, f => Guid.NewGuid())
                .RuleFor(p => p.CreatedAt, f => f.Date.Past(3))
                .RuleFor(p => p.Name, f => f.Name.JobTitle())
                .RuleFor(p => p.Description, f => f.Lorem.Sentence(5))
                .RuleFor(p => p.IsActive, f => true)
                .RuleFor(p => p.IsDeleted, f => false);

            var fakeProfessions = professionFaker.Generate(27);
            
            // Make exactly 4 randomly selected professions inactive
            var randomizer = new Bogus.Randomizer();
            var inactiveProfessions = randomizer.ArrayElements(fakeProfessions.ToArray(), 4);
            foreach (var ip in inactiveProfessions)
            {
                ip.IsActive = false;
            }

            var activeProfessions = fakeProfessions.Where(p => p.IsActive).ToList();

            // 2. Address Faker //[cite: 1, 5]
            var addressFaker = new Faker<EmployeeAddress>()
                .RuleFor(a => a.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(a => a.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(a => a.AddressLine, f => f.Address.StreetAddress()) //[cite: 1, 5]
                .RuleFor(a => a.PostalCode, f => f.Address.ZipCode()) //[cite: 1, 5]
                .RuleFor(a => a.City, f => f.Address.City()) //[cite: 1, 5]
                .RuleFor(a => a.State, f => f.Address.State()) //[cite: 1, 5]
                .RuleFor(a => a.Country, f => f.PickRandom("United Kingdom", "Germany")) //[cite: 1, 5]
                .RuleFor(a => a.IsPrimary, f => true) //[cite: 1, 5]
                .RuleFor(a => a.StartDate, f => f.Date.Past(2))
                .RuleFor(a => a.EndDate, f => (DateTime?)null);

            // 3. Compensation Faker //[cite: 1, 6]
            var compensationFaker = new Faker<EmployeeCompensation>()
                .RuleFor(c => c.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(c => c.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(c => c.BaseSalary, f => f.Finance.Amount(3000m, 12000m)) //[cite: 1, 6]
                .RuleFor(c => c.SalaryType, f => f.PickRandom<SalaryType>()) //[cite: 1, 6]
                .RuleFor(c => c.EffectiveDate, f => f.Date.Past(2))
                .RuleFor(c => c.CreatedByUserId, f => creatorUserId); //[cite: 1, 6]

            // 5. Note Faker //[cite: 1, 8]
            var noteFaker = new Faker<EmployeeNote>()
                .RuleFor(n => n.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(n => n.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(n => n.Title, f => f.Lorem.Sentence(3)) //[cite: 1, 8]
                .RuleFor(n => n.Content, f => f.Lorem.Paragraphs(2)) //[cite: 1, 8]
                .RuleFor(n => n.Category, f => f.PickRandom<NoteCategory>()) //[cite: 1, 8]
                .RuleFor(n => n.IsConfidential, f => f.Random.Bool(0.2f)) //[cite: 1, 8]
                .RuleFor(n => n.CreatedByUserId, f => creatorUserId); //[cite: 1, 8]

            // 6. Reference Faker //[cite: 1, 9]
            var referenceFaker = new Faker<EmployeeReference>()
                .RuleFor(r => r.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(r => r.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(r => r.CompanyName, f => f.Company.CompanyName()) //[cite: 1, 9]
                .RuleFor(r => r.ContactPerson, f => f.Name.FullName()) //[cite: 1, 9]
                .RuleFor(r => r.Title, f => f.Name.JobTitle()) //[cite: 1, 9]
                .RuleFor(r => r.Relationship, f => f.PickRandom<Domain.Enums.ReferenceRelationship>())
                .RuleFor(r => r.Phone, f => f.Phone.PhoneNumber()) //[cite: 1, 9]
                .RuleFor(r => r.Email, f => f.Internet.Email()) //[cite: 1, 9]
                .RuleFor(r => r.Notes, f => f.Lorem.Sentence()); //[cite: 1, 9]

            // 7. Master Employee Faker
            var employeeFaker = new Faker<Employee>()
                .RuleFor(e => e.Id, f => Guid.NewGuid())
                .RuleFor(e => e.CreatedAt, f => f.Date.Past(1))
                .RuleFor(e => e.CreatedByUserId, f => creatorUserId)
                .RuleFor(e => e.EmployeeNo, f => $"EMP{f.IndexFaker + 1001:D4}")
                .RuleFor(e => e.FirstName, f => f.Name.FirstName())
                .RuleFor(e => e.LastName, f => f.Name.LastName())
                .RuleFor(e => e.Email, (f, e) => f.Internet.Email(e.FirstName.ToLowerInvariant(), e.LastName.ToLowerInvariant(), "softpms.com"))
                .RuleFor(e => e.Gender, f => f.PickRandom<Gender>())
                .RuleFor(e => e.DateOfBirth, f => f.Date.Past(30, DateTime.UtcNow.AddYears(-20)))
                .RuleFor(e => e.Nationality, f => f.PickRandom("British", "German", "Turkish"))
                .RuleFor(e => e.EmploymentStatus, f => f.PickRandom<EmploymentStatus>())
                .RuleFor(e => e.HireDate, f => f.Date.Past(3))
                .RuleFor(e => e.WorkingHoursPerWeek, f => 40m)
                .RuleFor(e => e.AnnualVacationDays, f => 20)
                .RuleFor(e => e.CarriedOverLeaves, f => 0)
                .RuleFor(e => e.IsDeleted, f => false)

                // --- Assign Profession (From active ones) ---
                .RuleFor(e => e.ProfessionId, f => f.PickRandom(activeProfessions).Id)

                // --- Assign Department (One of the 10 generated departments) --- //[cite: 3, 4]
                .RuleFor(e => e.DepartmentId, f => f.PickRandom(fakeDepartments).Id) //[cite: 3, 4]

                // --- Create Subcollections with Guid Links --- //[cite: 1]
                .RuleFor(e => e.Addresses, (f, e) => {
                    var count = f.Random.Int(1, 2);
                    var addresses = addressFaker.Generate(count);
                    for (int i = 0; i < addresses.Count; i++)
                    {
                        var a = addresses[i];
                        a.EmployeeId = e.Id;
                        if (i == 0)
                        {
                            a.IsPrimary = true;
                            a.StartDate = e.HireDate;
                            a.EndDate = count > 1 ? e.HireDate.AddMonths(6) : null;
                        }
                        else
                        {
                            a.IsPrimary = false;
                            a.StartDate = e.HireDate.AddMonths(6).AddDays(1);
                            a.EndDate = null;
                        }
                    }
                    return addresses;
                })
                .RuleFor(e => e.Compensations, (f, e) => {
                    var comp = compensationFaker.Generate();
                    comp.EmployeeId = e.Id;
                    return new List<EmployeeCompensation> { comp };
                })

                .RuleFor(e => e.Notes, (f, e) => {
                    var notes = noteFaker.Generate(f.Random.Int(0, 3)); //[cite: 1]
                    notes.ForEach(n => n.EmployeeId = e.Id); //[cite: 1, 8]
                    return notes; //[cite: 1]
                })
                .RuleFor(e => e.References, (f, e) => {
                    var refs = referenceFaker.Generate(f.Random.Int(1, 3)); //[cite: 1]
                    refs.ForEach(r => r.EmployeeId = e.Id); //[cite: 1, 9]
                    return refs; //[cite: 1]
                });

            // Generate 100 employees and all their nested linked data //[cite: 1]
            var fakeEmployees = employeeFaker.Generate(100); //[cite: 1]

            // Add Departments, Professions, then Employees to the database
            await _context.Departments.AddRangeAsync(fakeDepartments);
            await _context.Professions.AddRangeAsync(fakeProfessions);
            await _context.Employees.AddRangeAsync(fakeEmployees);
            await _context.SaveChangesAsync();

            _logger.LogInformation("10 Departments, 27 Professions, 100 employees and all their related data successfully added.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while seeding the database.");
            throw;
        }

        try
        {
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                var allEmployees = await _context.Employees.OrderBy(e => e.CreatedAt).ToListAsync();
                if (allEmployees.Count > 0)
                {
                    _logger.LogInformation("Development environment detected. Re-seeding Employee Numbers sequentially...");
                    int counter = 1;
                    foreach (var emp in allEmployees)
                    {
                        emp.EmployeeNo = $"EMP-{counter:D6}";
                        counter++;
                    }
                    await _context.SaveChangesAsync();

                    // Advance the database sequence to catch up
                    var connection = ((DbContext)_context).Database.GetDbConnection();
                    bool wasOpen = connection.State == System.Data.ConnectionState.Open;
                    if (!wasOpen) await connection.OpenAsync();
                    try
                    {
                        using var command = connection.CreateCommand();
                        command.CommandText = $"ALTER SEQUENCE EmployeeNoSequence RESTART WITH {counter};";
                        await command.ExecuteNonQueryAsync();
                        _logger.LogInformation($"EmployeeNoSequence restarted with {counter}");
                    }
                    finally
                    {
                        if (!wasOpen) await connection.CloseAsync();
                    }
                }
            }
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "An error occurred while re-seeding employee numbers in development environment.");
        }
    }
}