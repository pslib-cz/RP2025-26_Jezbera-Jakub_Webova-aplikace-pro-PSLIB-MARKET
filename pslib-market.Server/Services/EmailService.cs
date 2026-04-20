using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace pslib_market.Server.Services;

public class EmailService
{
    private readonly GraphServiceClient? _graphClient;
    private readonly string? _userId;

    public EmailService(IConfiguration config)
    {
        var tenantId = config["Email:TenantId"];
        var clientId = config["Email:ClientId"];
        var clientSecret = config["Email:ClientSecret"];
        _userId = config["Email:UserId"] ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId) ||
            string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(clientSecret) ||
            string.IsNullOrWhiteSpace(_userId))
        {
            return;
        }

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        _graphClient = new GraphServiceClient(credential, new[] { "https://graph.microsoft.com/.default" });
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        if (_graphClient is null || string.IsNullOrWhiteSpace(_userId))
        {
            throw new InvalidOperationException("Email service není nakonfigurovaný. Doplňte Email:TenantId, Email:ClientId, Email:ClientSecret a Email:UserId.");
        }

        var message = new Message
        {
            Subject = subject,
            Body = new ItemBody
            {
                ContentType = BodyType.Text,
                Content = body
            },
            ToRecipients =
            [
                new Recipient { EmailAddress = new EmailAddress { Address = toEmail } }
            ]
        };

        var sendMailPostRequestBody = new Microsoft.Graph.Users.Item.SendMail.SendMailPostRequestBody
        {
            Message = message,
            SaveToSentItems = false
        };

        await _graphClient.Users[_userId].SendMail.PostAsync(sendMailPostRequestBody);
    }
}