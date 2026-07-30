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
            // Eğer veritabanında halihazırda Employee veya Department varsa işlemi tamamen atlasın (Tek seferlik kuralı) //[cite: 1]
            if (await _context.Employees.AnyAsync() || await _context.Departments.AnyAsync())
            {
                return; //[cite: 1]
            }

            var creatorUserId = Guid.Parse("69318b93-57c8-4a54-8aae-05eec7d4ba95"); //[cite: 1]

            // Foreign Key hatası almamak için bu ID'ye sahip bir User veritabanında var mı kontrol ediyoruz //[cite: 1]
            var creatorUserExists = await _context.Users.AnyAsync(u => u.Id == creatorUserId); //[cite: 1]

            if (!creatorUserExists) //[cite: 1]
            {
                _logger.LogWarning("Seeding iptal edildi: '69318b93-57c8-4a54-8aae-05eec7d4ba95' ID'li bir User veritabanında bulunamadı! Önce user eklemelisiniz."); //[cite: 1]
                return; //[cite: 1]
            }

            _logger.LogInformation("Bogus ile 10 Departman ve bunlarla ilişkili sahte personel verileri (100 adet) üretiliyor...");

            // 1. Department Faker //[cite: 3]
            var departmentFaker = new Faker<Department>()
                .RuleFor(d => d.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(d => d.CreatedAt, f => f.Date.Past(3)) //[cite: 2]
                .RuleFor(d => d.Name, f => f.Commerce.Department()) //[cite: 3]
                .RuleFor(d => d.Description, f => f.Lorem.Sentence(5)); //[cite: 3]

            // 10 Adet Departman Üret
            var fakeDepartments = departmentFaker.Generate(10);

            // 2. Address Faker //[cite: 1, 5]
            var addressFaker = new Faker<EmployeeAddress>()
                .RuleFor(a => a.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(a => a.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(a => a.AddressLine, f => f.Address.StreetAddress()) //[cite: 1, 5]
                .RuleFor(a => a.PostalCode, f => f.Address.ZipCode()) //[cite: 1, 5]
                .RuleFor(a => a.City, f => f.Address.City()) //[cite: 1, 5]
                .RuleFor(a => a.State, f => f.Address.State()) //[cite: 1, 5]
                .RuleFor(a => a.Country, f => f.PickRandom("United Kingdom", "Germany")) //[cite: 1, 5]
                .RuleFor(a => a.IsPrimary, f => true); //[cite: 1, 5]

            // 3. Compensation Faker //[cite: 1, 6]
            var compensationFaker = new Faker<EmployeeCompensation>()
                .RuleFor(c => c.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(c => c.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(c => c.PayGrade, f => f.Random.String2(1, "ABCDE") + f.Random.Number(1, 5)) //[cite: 1, 6]
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
                .RuleFor(n => n.CreatedByUserId, f => creatorUserId); //[cite: 1, 8]

            // 6. Reference Faker //[cite: 1, 9]
            var referenceFaker = new Faker<EmployeeReference>()
                .RuleFor(r => r.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(r => r.CreatedAt, f => f.Date.Past(1)) //[cite: 2]
                .RuleFor(r => r.CompanyName, f => f.Company.CompanyName()) //[cite: 1, 9]
                .RuleFor(r => r.ContactPerson, f => f.Name.FullName()) //[cite: 1, 9]
                .RuleFor(r => r.Title, f => f.Name.JobTitle()) //[cite: 1, 9]
                .RuleFor(r => r.Phone, f => f.Phone.PhoneNumber()) //[cite: 1, 9]
                .RuleFor(r => r.Email, f => f.Internet.Email()) //[cite: 1, 9]
                .RuleFor(r => r.Notes, f => f.Lorem.Sentence()); //[cite: 1, 9]

            // 7. Main Employee Faker //[cite: 1, 4]
            int employeeIdCounter = 1; //[cite: 1]
            var employeeFaker = new Faker<Employee>() //[cite: 1]
                .RuleFor(e => e.Id, f => Guid.NewGuid()) //[cite: 2]
                .RuleFor(e => e.CreatedAt, f => f.Date.Past(2)) //[cite: 2]
                .RuleFor(e => e.EmployeeNo, f => $"EMP-{employeeIdCounter++:D4}") //[cite: 1, 4]
                .RuleFor(e => e.FirstName, f => f.Name.FirstName()) //[cite: 1, 4]
                .RuleFor(e => e.LastName, f => f.Name.LastName()) //[cite: 1, 4]
                .RuleFor(e => e.Gender, f => f.PickRandom<Gender>()) //[cite: 1, 4]
                .RuleFor(e => e.DateOfBirth, f => f.Date.Past(40, DateTime.Now.AddYears(-18))) //[cite: 1, 4]
                .RuleFor(e => e.Nationality, f => f.PickRandom("English", "German")) //[cite: 1, 4]
                .RuleFor(e => e.Profession, f => f.Name.JobTitle()) //[cite: 1, 4]
                .RuleFor(e => e.EmploymentStatus, f => f.PickRandom<EmploymentStatus>()) //[cite: 1, 4]
                .RuleFor(e => e.HireDate, f => f.Date.Past(5)) //[cite: 1, 4]
                .RuleFor(e => e.TerminationDate, f => null) //[cite: 1, 4]
                .RuleFor(e => e.ProbationEndDate, (f, e) => e.HireDate.AddMonths(3)) //[cite: 1, 4]
                .RuleFor(e => e.WorkingHoursPerWeek, f => f.Random.Decimal(20m, 40m)) //[cite: 1, 4]
                .RuleFor(e => e.AnnualVacationDays, f => f.Random.Int(14, 20))
                .RuleFor(e => e.CarriedOverLeaves, f => f.Random.Int(0, 10))
                .RuleFor(e => e.IsDeleted, false) //[cite: 1, 4]
                .RuleFor(e => e.CreatedByUserId, creatorUserId) //[cite: 1, 4]

                // --- Departman Ataması (Üretilen 10 departmandan biri) --- //[cite: 3, 4]
                .RuleFor(e => e.DepartmentId, f => f.PickRandom(fakeDepartments).Id) //[cite: 3, 4]

                // --- Alt Koleksiyonların Guid Bağlantılarıyla Oluşturulması --- //[cite: 1]
                .RuleFor(e => e.Addresses, (f, e) => {
                    var addresses = addressFaker.Generate(f.Random.Int(1, 2)); //[cite: 1]
                    addresses.ForEach(a => a.EmployeeId = e.Id); //[cite: 1, 5]
                    return addresses; //[cite: 1]
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

            // 100 adet çalışan ve iç içe bağlı tüm verileri üret //[cite: 1]
            var fakeEmployees = employeeFaker.Generate(100); //[cite: 1]

            // Önce Departmanları, sonra Personelleri veritabanına ekle
            await _context.Departments.AddRangeAsync(fakeDepartments);
            await _context.Employees.AddRangeAsync(fakeEmployees); //[cite: 1]
            await _context.SaveChangesAsync(); //[cite: 1]

            _logger.LogInformation("10 Adet Departman, 100 adet personel ve bunlara bağlı tüm ilişkili veriler başarıyla eklendi.");
        }
        catch (Exception ex) //[cite: 1]
        {
            _logger.LogError(ex, "Veritabanı seed edilirken beklenmedik bir hata oluştu."); //[cite: 1]
            throw; //[cite: 1]
        }
    }
}