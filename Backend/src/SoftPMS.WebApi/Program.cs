using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using SoftPMS.Application;
using SoftPMS.Infrastructure;
using SoftPMS.Infrastructure.Persistence;
using SoftPMS.Persistence;
using SoftPMS.WebApi.Common;
using SoftPMS.WebApi.Middleware;
using SoftPMS.WebApi.OpenApi;

// Force invariant (English) culture for all threads so that DateTime.ToString("MMMM dd")
// and similar format strings produce English month/day names regardless of the server OS locale.
CultureInfo.DefaultThreadCurrentCulture = CultureInfo.InvariantCulture;
CultureInfo.DefaultThreadCurrentUICulture = CultureInfo.InvariantCulture;

var builder = WebApplication.CreateBuilder(args);

// ── Layer service registrations ──────────────────────────────────────────────
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddPersistenceServices(
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured."));

builder.Services.Configure<SoftPMS.Application.Common.Settings.SystemSettings>(
    builder.Configuration.GetSection("SystemSettings"));

// ── JWT Bearer authentication ─────────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey  = jwtSection["SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer           = true,
            ValidIssuer              = jwtSection["Issuer"],
            ValidateAudience         = true,
            ValidAudience            = jwtSection["Audience"],
            ValidateLifetime         = true,
            ClockSkew                = TimeSpan.Zero, // Tokens expire precisely on time — no tolerance
        };

        // Return structured JSON on 401 instead of an empty response
        options.Events = new JwtBearerEvents
        {
            OnChallenge = ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode  = StatusCodes.Status401Unauthorized;
                ctx.Response.ContentType = "application/json";
                return ctx.Response.WriteAsync(
                    """{"status":401,"title":"Unauthorized","message":"A valid Bearer token is required."}""");
            },
        };
    });

builder.Services.AddAuthorization();

// ── CORS (permissive for development — tighten in production) ─────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// ── Controllers ───────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableUtcDateTimeJsonConverter());
    });

// ── OpenAPI (built-in .NET 10) + Scalar ──────────────────────────────────────
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, ct) =>
    {
        document.Info = new()
        {
            Title       = "SoftPMS API",
            Version     = "v1",
            Description = "Personnel Management System — RESTful API",
        };
        return Task.CompletedTask;
    });

    // Add JWT Bearer security scheme to every generated document
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Seed database at startup (migrations + seed data) ────────────────────────
try
{
    await DatabaseSeeder.SeedAsync(app.Services);
}
catch (OperationCanceledException)
{
    // Application is shutting down during seed — not a database error, just re-throw.
    throw;
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogCritical(ex, "An unhandled exception occurred during database seeding.");
    throw;
}

// ── HTTP pipeline ─────────────────────────────────────────────────────────────

// Global exception handler — registered first to catch all downstream exceptions
app.UseGlobalExceptionHandler();

if (app.Environment.IsDevelopment())
{
    // Expose the raw OpenAPI JSON document
    app.MapOpenApi();

    // Scalar UI (replaces Swagger UI) at /scalar/v1
    app.MapScalarApiReference(options =>
    {
        options.Title           = "SoftPMS API";
        options.Theme           = ScalarTheme.Purple;
        options.DefaultHttpClient = new(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<ApplicationDbContextInitialiser>();
    await initialiser.SeedAsync();
}


app.Run();
