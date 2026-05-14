using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Services;
using Scalar.AspNetCore;
using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using SixLabors.ImageSharp;
using pslib_market.Server.Services.ImageProcessing;

var builder = WebApplication.CreateBuilder(args);

static bool HasAdminAccess(ClaimsPrincipal user)
{
    static bool IsAdminValue(string value)
        => string.Equals(value, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);

    var hasMarketAdminClaim = user.Claims.Any(c =>
        string.Equals(c.Type, "market.admin", StringComparison.OrdinalIgnoreCase)
        && IsAdminValue(c.Value));

    var hasAdminRole = user.Claims.Any(c =>
        (string.Equals(c.Type, ClaimTypes.Role, StringComparison.OrdinalIgnoreCase)
         || string.Equals(c.Type, "role", StringComparison.OrdinalIgnoreCase)
         || string.Equals(c.Type, "roles", StringComparison.OrdinalIgnoreCase))
        && string.Equals(c.Value, "market.admin", StringComparison.OrdinalIgnoreCase));

    return hasMarketAdminClaim || hasAdminRole;
}

// Add services to the container.

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Sandbox")));
builder.Services.AddSingleton<EmailService>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireAssertion(context => HasAdminAccess(context.User)));
});



var authority = builder.Configuration["OAuth:Authority"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = "market";
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = false 
        };
    });


builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("UserBasedAdCreation", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value 
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new SlidingWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 1, 
                Window = TimeSpan.FromSeconds(30),
                SegmentsPerWindow = 3,
                QueueLimit = 0
            }));

    options.AddPolicy("UserBasedReservation", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value 
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new SlidingWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 5,
                Window = TimeSpan.FromSeconds(60),
                SegmentsPerWindow = 6,
                QueueLimit = 0
            }));

    options.AddPolicy("UserBasedAdUpdate", httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value 
                          ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new SlidingWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 3,
                Window = TimeSpan.FromSeconds(120),
                SegmentsPerWindow = 4,
                QueueLimit = 0
            }));
});


builder.Services.AddSingleton<ImageProcessingQueue>();
builder.Services.AddHostedService<ImageProcessingWorker>();


var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.UseCors();
app.UseRateLimiter();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


app.MapFallbackToFile("/index.html");


using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

app.Run();
