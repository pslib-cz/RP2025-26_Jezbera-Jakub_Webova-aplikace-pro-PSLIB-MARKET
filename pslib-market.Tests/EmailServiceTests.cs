using Microsoft.Extensions.Configuration;
using pslib_market.Server.Services;
using Xunit;

namespace pslib_market.Tests;

public class EmailServiceTests
{
    private static EmailService CreateService(Dictionary<string, string?> config)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(config)
            .Build();
        return new EmailService(configuration);
    }

   [Fact]
public async Task SendEmailAsync_ThrowsInvalidOperation_WhenNotConfigured()
{
    var service = CreateService(new Dictionary<string, string?>
    {
        { "Email:TenantId", null },
        { "Email:ClientId", null },
        { "Email:ClientSecret", null },
        { "Email:UserId", null }
    });

    var ex = await Assert.ThrowsAsync<InvalidOperationException>(
        () => service.SendEmailAsync("test@pslib.cz", "Předmět", "Tělo"));

    Assert.Contains("nakonfigurovaný", ex.Message, StringComparison.OrdinalIgnoreCase);
}

    [Fact]
    public async Task SendEmailAsync_ThrowsInvalidOperation_WhenOnlyPartialConfigProvided()
    {
        var service = CreateService(new Dictionary<string, string?>
        {
            { "Email:TenantId", "tenant-123" },
            { "Email:ClientId", null },        // chybí
            { "Email:ClientSecret", null },    // chybí
            { "Email:UserId", null }           // chybí
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendEmailAsync("test@pslib.cz", "Předmět", "Tělo"));
    }

    [Fact]
    public async Task SendEmailAsync_ThrowsInvalidOperation_WhenUserIdMissing()
    {
        var service = CreateService(new Dictionary<string, string?>
        {
            { "Email:TenantId", "tenant-123" },
            { "Email:ClientId", "client-456" },
            { "Email:ClientSecret", "secret-789" },
            { "Email:UserId", null }  // chybí UserId
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.SendEmailAsync("test@pslib.cz", "Předmět", "Tělo"));
    }
}