using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Services;
using Scalar.AspNetCore;
using System.Security.Claims;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using SixLabors.ImageSharp;
using pslib_market.Server.Services.ImageProcessing;

var builder = WebApplication.CreateBuilder(args);
var adminClaimName = builder.Configuration["OAuth:ClaimAdmin"] ?? "market.admin";

static bool IsTruthyClaimValue(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    return string.Equals(value, "1", StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, "true", StringComparison.OrdinalIgnoreCase);
}

static bool IsTruthyJsonValue(JsonElement value)
{
    return value.ValueKind switch
    {
        JsonValueKind.True => true,
        JsonValueKind.Number => value.TryGetInt32(out var number) && number == 1,
        JsonValueKind.String => IsTruthyClaimValue(value.GetString()),
        _ => false
    };
}

static bool HasAdminAccess(ClaimsPrincipal user, string claimName)
{
    var hasMarketAdminClaim = user.Claims.Any(c =>
        string.Equals(c.Type, claimName, StringComparison.OrdinalIgnoreCase)
        && IsTruthyClaimValue(c.Value));

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
        policy.WithOrigins("http://localhost:51572", "https://market.pslib.cloud")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Sandbox")));
builder.Services.AddSingleton<EmailService>();
builder.Services.AddHttpClient();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireAssertion(context => HasAdminAccess(context.User, adminClaimName)));
});



var authority = builder.Configuration["OAuth:Authority"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authority;
        options.Audience = "Market";
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = "Market",
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                if (principal?.Identity is not ClaimsIdentity identity)
                {
                    return;
                }

                if (principal.Claims.Any(c =>
                        string.Equals(c.Type, adminClaimName, StringComparison.OrdinalIgnoreCase) &&
                        IsTruthyClaimValue(c.Value)))
                {
                    return;
                }

                var authorizationHeader = context.Request.Headers.Authorization.ToString();
                if (!authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    return;
                }

                var accessToken = authorizationHeader["Bearer ".Length..].Trim();
                if (string.IsNullOrWhiteSpace(accessToken))
                {
                    return;
                }

                try
                {
                    var httpClientFactory = context.HttpContext.RequestServices.GetRequiredService<IHttpClientFactory>();
                    var httpClient = httpClientFactory.CreateClient();
                    httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

                    var userInfoUri = new Uri(new Uri(authority!.TrimEnd('/') + "/"), "connect/userinfo");
                    using var userInfoResponse = await httpClient.GetAsync(userInfoUri);

                    if (!userInfoResponse.IsSuccessStatusCode)
                    {
                        return;
                    }

                    await using var userInfoStream = await userInfoResponse.Content.ReadAsStreamAsync();
                    using var userInfoJson = await JsonDocument.ParseAsync(userInfoStream);

                    if (!userInfoJson.RootElement.TryGetProperty(adminClaimName, out var adminClaimValue))
                    {
                        return;
                    }

                    if (!IsTruthyJsonValue(adminClaimValue))
                    {
                        return;
                    }

                    if (!identity.HasClaim(c => string.Equals(c.Type, adminClaimName, StringComparison.OrdinalIgnoreCase)))
                    {
                        identity.AddClaim(new Claim(adminClaimName, "true"));
                    }
                }
                catch
                {
                    return;
                }
            }
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

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor
                       | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

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
