using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Models;
using pslib_market.Server.Models.Enums;
using pslib_market.Server.Services;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;
using System.Security.Claims;


namespace pslib_market.Server.Controller
{

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BooksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailService _emailService;
        private readonly ILogger<BooksController> _logger;
        private readonly IConfiguration _configuration;

        private static bool HasAdminAccess(ClaimsPrincipal user)
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

        private static string? GetUserEmailFromClaims(ClaimsPrincipal user)
        {
            return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                ?? user.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
        }

        private IEnumerable<string> GetAdminNotificationRecipients()
        {
            var recipients = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var configuredRecipients = _configuration
                .GetSection("Email:AdminNotificationRecipients")
                .Get<string[]>() ?? [];

            foreach (var recipient in configuredRecipients)
            {
                if (!string.IsNullOrWhiteSpace(recipient))
                {
                    recipients.Add(recipient.Trim());
                }
            }

            if (HasAdminAccess(User))
            {
                var adminEmailFromClaim = GetUserEmailFromClaims(User);
                if (!string.IsNullOrWhiteSpace(adminEmailFromClaim))
                {
                    recipients.Add(adminEmailFromClaim);
                }
            }

            return recipients;
        }

        private string GetAppBaseUrl()
        {
            var configuredUrl = _configuration["Email:AppUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
            {
                return configuredUrl.TrimEnd('/');
            }

            return $"{Request.Scheme}://{Request.Host}".TrimEnd('/');
        }

        private string BuildEmailBodyWithAppLink(string body, string? appPath = null)
        {
            var baseUrl = GetAppBaseUrl();
            var targetUrl = string.IsNullOrWhiteSpace(appPath)
                ? baseUrl
                : $"{baseUrl}/{appPath.TrimStart('/')}";

            return $"{body}\n\nOtevřít PSLIB Market: {targetUrl}";
        }

        public BooksController(
            ApplicationDbContext context,
            EmailService emailService,
            ILogger<BooksController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<BookDto>>> GetBooks()
        {
            var now = DateTime.UtcNow;
            var oneMonthAgo = now.AddMonths(-1);
            var twoYearsAgo = now.AddYears(-2);

            var books = await _context.Books
                .Include(b => b.Tags)
                .Where(b =>
                    b.SaleStatus == SaleStatus.Available ||
                    (b.SaleStatus == SaleStatus.Reserved && b.LastUpdatedAt >= oneMonthAgo))
                .OrderBy(b => b.SaleStatus == SaleStatus.Reserved ? 1 : 0)
                .ThenByDescending(b => b.CreatedAt)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    Price = b.Price,
                    OwnerId = b.OwnerId,
                    SaleStatus = b.SaleStatus,
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    OwnerName = b.OwnerName,
                    OwnerEmail = b.OwnerEmail,
                    Condition = b.Condition,

                })
                .ToListAsync();

            return Ok(books);
        }

        [HttpPost]
        public async Task<ActionResult<Book>> CreateBook([FromForm] CreateBookDTO dto)
        {

            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
             ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                            ?? User.Claims.FirstOrDefault(c => c.Type == "email")?.Value;

            var userName = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                           ?? User.Claims.FirstOrDefault(c => c.Type == "name")?.Value;

            if (string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(userEmail))
            {
                userName = userEmail.Split('@')[0];
            }

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userEmail) || string.IsNullOrEmpty(userName))
            {
                return Unauthorized("Neplatné uživatelské údaje.");
            }
            if ( dto.Photo == null || dto.Photo.Length == 0)
            {
                return BadRequest("Fotka je povinná.");
            }

            byte[]? imageBytes = null;
            using var ms = new MemoryStream();
            using (var image = await Image.LoadAsync(dto.Photo.OpenReadStream()))
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(800, 800)
                }));
                await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = 75 });
            }
            imageBytes = ms.ToArray();


            var book = new Book
            {
                Title = dto.Title,
                Price = dto.Price,
                Description = dto.Description,

                OwnerId = userId,
                OwnerEmail = userEmail,
                OwnerName = userName,
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow,
                SaleStatus = SaleStatus.Pending,
                Condition = dto.Condition,

                ImageBlob = imageBytes,
                ImageContentType = "image/jpeg",


            };
            if (!string.IsNullOrEmpty(dto.Subject))
            {
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == dto.Subject);
                if (tag != null)
                {
                    book.Tags.Add(tag);
                }
            }

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            try
            {
                var recipients = GetAdminNotificationRecipients().ToList();
                var subject = "Nový inzerát ke schválení";
                var body = BuildEmailBodyWithAppLink(
                    $"Uživatel {userName} vytvořil inzerát '{dto.Title}', který čeká na schválení.",
                    "admin/schvalovani");

                if (recipients.Count == 0)
                {
                    _logger.LogWarning("Nenalezen žádný příjemce admin notifikace pro nový inzerát {BookId}.", book.Id);
                }

                foreach (var recipient in recipients)
                {
                    await _emailService.SendEmailAsync(recipient, subject, body);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nepodařilo se odeslat upozornění adminovi na nový inzerát {BookId}.", book.Id);
            }

            return CreatedAtAction(nameof(GetBooks), new { id = book.Id }, book);
        }

        [HttpGet("pending")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<IEnumerable<BookDto>>> GetPendingBooks()
        {
            var pendingBooks = await _context.Books
                .Include(b => b.Tags)
                .Where(b => b.SaleStatus == SaleStatus.Pending)
                .OrderByDescending(b => b.LastUpdatedAt)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    Price = b.Price,
                    OwnerId = b.OwnerId,
                    SaleStatus = b.SaleStatus,
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    OwnerName = b.OwnerName,
                    OwnerEmail = b.OwnerEmail,
                    Condition = b.Condition,

                })
                .ToListAsync();

            return Ok(pendingBooks);
        }



        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] SaleStatus newStatus)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound("Inzerát nebyl nalezen.");
            }

            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            if (book.OwnerId != userId) return Forbid("Nemáte oprávnění měnit stav tohoto inzerátu.");

            book.SaleStatus = newStatus;
            book.LastUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/image")]
        [AllowAnonymous]
        public async Task<IActionResult> GetBookImage(int id)
        {
            var book = await _context.Books.FindAsync(id);

            if (book == null || book.ImageBlob == null)
            {
                return NotFound("Tento inzerát nemá žádnou fotku.");
            }
            var contentType = string.IsNullOrEmpty(book.ImageContentType) ? "image/jpeg" : book.ImageContentType;

            return File(book.ImageBlob, contentType);
        }


        [HttpPost("{id}/reserve")]
        [Authorize]
        public async Task<IActionResult> ReserveBook(int id)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
             ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
            var userEmail = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                            ?? User.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
            var userName = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                            ?? User.Claims.FirstOrDefault(c => c.Type == "name")?.Value;

            if (string.IsNullOrEmpty(userName) && !string.IsNullOrEmpty(userEmail))
            {
                userName = userEmail.Split('@')[0];
            }

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Neplatné uživatelské údaje.");
            }

            var book = await _context.Books
                .Include(b => b.Reservations)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (book == null)
            {
                return NotFound("Inzerát nebyl nalezen.");
            }
            if (book.OwnerId == userId)
            {
                return BadRequest("Nemůžete rezervovat svůj vlastní inzerát.");
            }
            if (book.Reservations.Any(r => r.ReservedByUserId == userId))
            {
                return BadRequest("Tento inzerát již máte rezervovaný.");
            }

            var reservation = new BookReservation
            {
                BookId = id,
                ReservedByUserId = userId,
                ReservedByUserName = userName!,
                ReservedByUserEmail = userEmail!,
                ReservedAt = DateTime.UtcNow
            };
            book.Reservations.Add(reservation);

            if (book.SaleStatus == SaleStatus.Available)
            {
                book.SaleStatus = SaleStatus.Reserved;
            }
            await _context.SaveChangesAsync();

            try
            {
                var subject = "Nová rezervace vaší knihy";
                var body = BuildEmailBodyWithAppLink(
                    $"Dobrý den, uživatel {userName} si právě rezervoval vaši knihu '{book.Title}'. Spojte se s ním na emailu: {userEmail}.",
                    "moje-inzeraty");
                await _emailService.SendEmailAsync(book.OwnerEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nepodařilo se odeslat upozornění majiteli inzerátu {BookId} o nové rezervaci.", id);
            }

            return Ok("Inzerát byl úspěšně rezervován.");
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, [FromForm] CreateBookDTO dto)
        {
            var book = await _context.Books
                .Include(b => b.Tags)
                 .FirstOrDefaultAsync(b => b.Id == id);
            if (book == null)
            {
                return NotFound("Inzerát nebyl nalezen.");
            }
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
             ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            bool isAdmin = HasAdminAccess(User);


            if (book.OwnerId != userId && !isAdmin)
            {
                return Forbid("Nemáte oprávnění upravovat tento inzerát.");
            }

            var hasModeratedChanges =
                !string.Equals(book.Title, dto.Title, StringComparison.Ordinal) ||
                !string.Equals(book.Description ?? string.Empty, dto.Description ?? string.Empty, StringComparison.Ordinal) ||
                (dto.Photo != null && dto.Photo.Length > 0);

            book.Title = dto.Title;
            book.Description = dto.Description;
            book.Price = dto.Price;
            book.Condition = dto.Condition;
            book.LastUpdatedAt = DateTime.UtcNow;

            if (hasModeratedChanges)
            {
                book.SaleStatus = SaleStatus.Pending;

                try
                {
                    var recipients = GetAdminNotificationRecipients().ToList();
                    var subject = "Upravený inzerát ke schválení";
                    var body = BuildEmailBodyWithAppLink(
                        $"Inzerát '{book.Title}' byl upraven uživatelem a čeká na nové schválení.",
                        "admin/schvalovani");

                    if (recipients.Count == 0)
                    {
                        _logger.LogWarning("Nenalezen žádný příjemce admin notifikace pro upravený inzerát {BookId}.", book.Id);
                    }

                    foreach (var recipient in recipients)
                    {
                        await _emailService.SendEmailAsync(recipient, subject, body);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Nepodařilo se odeslat upozornění adminovi na úpravu inzerátu {BookId}.", book.Id);
                }
            }

            if (!string.IsNullOrEmpty(dto.Subject))
            {
                book.Tags.Clear();
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == dto.Subject);
                if (tag != null)
                {
                    book.Tags.Add(tag);
                }
            }
            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                byte[]? imageBytes = null;
                using var ms = new MemoryStream();
                using (var image = await Image.LoadAsync(dto.Photo.OpenReadStream()))
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(800, 800)
                    }));
                    await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = 75 });
                }
                imageBytes = ms.ToArray();
                book.ImageBlob = imageBytes;
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BookDto>>> GetMyBooks()
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var myBooks = await _context.Books
                .Include(b => b.Tags)
                .Include(b => b.Reservations)
                .Where(b => b.OwnerId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    Price = b.Price,
                    OwnerId = b.OwnerId,
                    SaleStatus = b.SaleStatus,
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    OwnerName = b.OwnerName,
                    OwnerEmail = b.OwnerEmail,
                    Condition = b.Condition,
                    Reservations = b.Reservations
                        .OrderBy(r => r.ReservedAt)
                        .Select(r => new BookReservationDto
                        {
                            ReservedByUserName = r.ReservedByUserName,
                            ReservedByUserEmail = r.ReservedByUserEmail,
                            ReservedAt = r.ReservedAt
                        })
                        .ToList()
                })
                .ToListAsync();
            return Ok(myBooks);


        }


        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> ApproveBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            if (book == null) return NotFound("Inzerát nebyl nalezen.");
            if (book.SaleStatus != SaleStatus.Pending) return BadRequest("Inzerát není ve stavu čekající na schválení.");
            
            book.SaleStatus = SaleStatus.Available;
            book.LastUpdatedAt = DateTime.UtcNow;

            _context.BookActivityLogs.Add(new BookActivityLog
            {
                BookId = id,
                UserId = adminId,
                Action = "Approve",
                Details = "Inzerát schválen administrátorem.",
                TimeStamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            try
            {
                var subject = "Váš inzerát byl schválen";
                var body = BuildEmailBodyWithAppLink(
                    $"Dobrý den, váš inzerát na knihu '{book.Title}' byl právě schválen a je viditelný pro ostatní.");
                await _emailService.SendEmailAsync(book.OwnerEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nepodařilo se odeslat schvalovací email pro inzerát {BookId}.", id);
            }

            return NoContent();
        }
        [HttpPatch("{id}/reject")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> RejectBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound("Inzerát nebyl nalezen.");
            if (book.SaleStatus != SaleStatus.Pending) return BadRequest("Inzerát není ve stavu čekající na schválení.");

            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

            book.SaleStatus = SaleStatus.Rejected;
            book.LastUpdatedAt = DateTime.UtcNow;
            _context.BookActivityLogs.Add(new BookActivityLog
            {
                BookId = id,
                UserId = adminId,
                Action = "Reject",
                Details = "Inzerát zamítnut administrátorem.",
                TimeStamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            try
            {
                var subject = "Váš inzerát byl zamítnut";
                var body = BuildEmailBodyWithAppLink(
                    $"Dobrý den, váš inzerát na knihu '{book.Title}' byl administrátorem zamítnut.");
                await _emailService.SendEmailAsync(book.OwnerEmail, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nepodařilo se odeslat zamítací email pro inzerát {BookId}.", id);
            }

            return NoContent();


        }
        }
}

