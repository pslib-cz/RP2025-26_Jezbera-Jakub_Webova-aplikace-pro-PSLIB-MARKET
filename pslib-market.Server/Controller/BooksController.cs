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
using Microsoft.AspNetCore.RateLimiting;
using pslib_market.Server.Helpers;
using pslib_market.Server.Services.ImageProcessing;

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

        private string GetAdminClaimName()
        {
            return _configuration["OAuth:ClaimAdmin"] ?? "market.admin";
        }

        private bool HasAdminAccess(ClaimsPrincipal user)
        {
            var hasMarketAdminClaim = user.Claims.Any(c =>
                string.Equals(c.Type, GetAdminClaimName(), StringComparison.OrdinalIgnoreCase)
                && (string.Equals(c.Value, "1", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase)));

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

        private string? GetCurrentUserId()
        {
            return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        }

        private string? GetCurrentUserEmail()
        {
            return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
        }

        private string? GetCurrentUserName()
        {
            return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "name")?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "upn")?.Value
                ?? User.Claims.FirstOrDefault(c => c.Type == "unique_name")?.Value;
        }



        private void AddBookActivityLog(int bookId, string action, string details, string? userName = null, string? userEmail = null)
        {
            var actorName = userName ?? GetCurrentUserName();
            var actorEmail = userEmail ?? GetCurrentUserEmail();

            _context.BookActivityLogs.Add(new BookActivityLog
            {
                BookId = bookId,
                UserId = BookHelpers.ResolveUserName(actorName, actorEmail),
                Action = action,
                Details = details,
                TimeStamp = DateTime.UtcNow
            });
        }

        private async Task ArchiveExpiredReservedBooksAsync(DateTime now)
        {
            var oneMonthAgo = now.AddMonths(-1);

            var booksToArchive = await _context.Books
                .Where(b => b.SaleStatus == SaleStatus.Reserved && b.LastUpdatedAt < oneMonthAgo)
                .ToListAsync();

            if (booksToArchive.Count == 0)
            {
                return;
            }

            foreach (var book in booksToArchive)
            {
                book.SaleStatus = SaleStatus.Archived;
                book.LastUpdatedAt = now;

                AddBookActivityLog(
                    book.Id,
                    "AutoArchive",
                    "Inzerát byl automaticky archivován systémem po více než měsíci ve stavu rezervace.",
                    userName: "Systém");
            }

            await _context.SaveChangesAsync();
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

        private static string NormalizeFilterValue(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }

        private IQueryable<Book> ApplyVisibilityScope(IQueryable<Book> query, bool isAdmin, DateTime now)
        {
            if (isAdmin)
            {
                return query;
            }

            var oneMonthAgo = now.AddMonths(-1);
            return query.Where(b =>
                b.SaleStatus == SaleStatus.Available ||
                (b.SaleStatus == SaleStatus.Reserved && b.LastUpdatedAt >= oneMonthAgo));
        }

        private static IQueryable<Book> ApplyBookSort(IQueryable<Book> query, string sort)
        {
            return sort.ToLowerInvariant() switch
            {
                "priceasc" => query.OrderBy(b => b.Price).ThenByDescending(b => b.CreatedAt),
                "pricedesc" => query.OrderByDescending(b => b.Price).ThenByDescending(b => b.CreatedAt),
                "oldest" => query.OrderBy(b => b.CreatedAt).ThenBy(b => b.Id),
                _ => query.OrderByDescending(b => b.CreatedAt).ThenByDescending(b => b.Id),
            };
        }

        private IQueryable<Book> ApplyBookFilters(
            IQueryable<Book> query,
            string? search,
            decimal? minPrice,
            decimal? maxPrice,
            IReadOnlyCollection<string> subjects,
            IReadOnlyCollection<int> conditions,
            IReadOnlyCollection<string> saleStatuses,
            string? currentUserEmail)
        {
            if (minPrice.HasValue)
            {
                query = query.Where(b => b.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(b => b.Price <= maxPrice.Value);
            }

            if (subjects.Count > 0)
            {
                query = query.Where(b => b.Tags.Any(t => subjects.Contains(t.Name)));
            }

            if (conditions.Count > 0)
            {
                query = query.Where(b => conditions.Contains((int)b.Condition));
            }

            var normalizedSearch = NormalizeFilterValue(search);
            if (!string.IsNullOrWhiteSpace(normalizedSearch))
            {
                query = query.Where(b =>
                    (b.Title != null && b.Title.ToLower().Contains(normalizedSearch)) ||
                    (b.Description != null && b.Description.ToLower().Contains(normalizedSearch)) ||
                    (b.OwnerName != null && b.OwnerName.ToLower().Contains(normalizedSearch)) ||
                    (b.OwnerEmail != null && b.OwnerEmail.ToLower().Contains(normalizedSearch)) ||
                    b.Tags.Any(t => t.Name.ToLower().Contains(normalizedSearch)));
            }

            if (saleStatuses.Count > 0)
            {
                var normalizedStatuses = saleStatuses
                    .Select(NormalizeFilterValue)
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .ToHashSet();
                var normalizedEmail = NormalizeFilterValue(currentUserEmail);
                var canUseReservedByMe = !string.IsNullOrWhiteSpace(normalizedEmail);

                query = query.Where(b =>
                    (normalizedStatuses.Contains("available") && b.SaleStatus == SaleStatus.Available) ||
                    (normalizedStatuses.Contains("reserved") && b.SaleStatus == SaleStatus.Reserved) ||
                    (normalizedStatuses.Contains("sold") && b.SaleStatus == SaleStatus.Sold) ||
                    (normalizedStatuses.Contains("pending") && b.SaleStatus == SaleStatus.Pending) ||
                    (normalizedStatuses.Contains("rejected") && b.SaleStatus == SaleStatus.Rejected) ||
                    (normalizedStatuses.Contains("archived") && b.SaleStatus == SaleStatus.Archived) ||
                    (normalizedStatuses.Contains("reservedbyme") && canUseReservedByMe &&
                        b.SaleStatus == SaleStatus.Reserved &&
                        b.Reservations.Any(r => r.ReservedByUserEmail.ToLower() == normalizedEmail)));
            }

            return query;
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
        public async Task<ActionResult<BooksPageResponse>> GetBooks(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? search = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery(Name = "subjects")] List<string>? subjects = null,
            [FromQuery(Name = "conditions")] List<int>? conditions = null,
            [FromQuery(Name = "saleStatuses")] List<string>? saleStatuses = null,
            [FromQuery] string sort = "newest")
        {
            var now = DateTime.UtcNow;
            await ArchiveExpiredReservedBooksAsync(now);

            var isAdmin = User.Identity?.IsAuthenticated == true && HasAdminAccess(User);
            var visibleBooksQuery = ApplyVisibilityScope(
                _context.Books
                    .AsNoTracking()
                    .Include(b => b.Tags)
                    .Include(b => b.Reservations)
                    .AsQueryable(),
                isAdmin,
                now);

            var visibleCount = await visibleBooksQuery.CountAsync();
            var minVisiblePrice = visibleCount > 0
                ? await visibleBooksQuery.MinAsync(book => book.Price)
                : 0m;
            var maxVisiblePrice = visibleCount > 0
                ? await visibleBooksQuery.MaxAsync(book => book.Price)
                : 0m;

            var filteredBooksQuery = ApplyBookFilters(
                visibleBooksQuery,
                search,
                minPrice,
                maxPrice,
                subjects ?? [],
                conditions ?? [],
                saleStatuses ?? [],
                GetCurrentUserEmail());

            var filteredCount = await filteredBooksQuery.CountAsync();
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            var totalPages = filteredCount == 0
                ? 1
                : (int)Math.Ceiling(filteredCount / (double)pageSize);
            page = Math.Min(page, totalPages);

            var currentEmail = GetCurrentUserEmail();

            var books = await ApplyBookSort(filteredBooksQuery, sort)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    Price = b.Price,
                    OwnerId = b.OwnerId,
                    SaleStatus = b.SaleStatus,
                    Tags = b.Tags.Select(t => new TagDTO
                    {
                        Name = t.Name,
                        BgColor = t.BgColor ?? "#e5e7eb",
                        TextColor = t.TextColor ?? "#111827"
                    }).ToList(),
                    OwnerName = b.OwnerName,
                    OwnerEmail = (isAdmin || b.OwnerEmail == currentEmail)
                        ? b.OwnerEmail
                        : null,
                    Condition = b.Condition,
                    Reservations = b.Reservations
                        .Where(r => isAdmin
                                 || b.OwnerEmail == currentEmail
                                 || r.ReservedByUserEmail == currentEmail)
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

            return Ok(new BooksPageResponse
            {
                Items = books,
                FilteredCount = filteredCount,
                VisibleCount = visibleCount,
                MinPrice = minVisiblePrice,
                MaxPrice = maxVisiblePrice,
                Page = page,
                PageSize = pageSize
            });
        }

        [HttpPost]
        [EnableRateLimiting("UserBasedAdCreation")]
        public async Task<ActionResult<Book>> CreateBook([FromForm] CreateBookDTO dto, [FromServices] ImageProcessingQueue imageQueue)
        {
            var userId = GetCurrentUserId();
            var userEmail = GetCurrentUserEmail();
            var userNameRaw = GetCurrentUserName();

            var userName = BookHelpers.ResolveUserName(userNameRaw, userEmail, fallback: string.Empty);

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userEmail) || string.IsNullOrEmpty(userName))
            {
                return Unauthorized("Neplatné uživatelské údaje.");
            }

            if (dto.Photo == null || dto.Photo.Length == 0)
            {
                return BadRequest("Fotka je povinná.");
            }

            if (!BookHelpers.IsSupportedPhotoUpload(dto.Photo.ContentType, dto.Photo.FileName))
            {
                return BadRequest("Podporované jsou jen JPEG, PNG, WebP, GIF, BMP nebo TIFF obrázky.");
            }

            using var memoryStream = new MemoryStream();
            await dto.Photo.CopyToAsync(memoryStream);
            var rawImageBytes = memoryStream.ToArray();

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
                ImageBlob = [],
                ImageContentType = dto.Photo.ContentType,
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

            await imageQueue.EnqueueAsync(new ImageProcessingJob(book.Id, rawImageBytes, dto.Photo.ContentType));


            AddBookActivityLog(
                book.Id,
                "Create",
                $"Uživatel vytvořil inzerát '{book.Title}', který čeká na schválení.",
                userName,
                userEmail);

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
                    Tags = b.Tags.Select(t => new TagDTO
                    {
                        Name = t.Name,
                        BgColor = t.BgColor ?? "#e5e7eb",
                        TextColor = t.TextColor ?? "#111827"
                    }).ToList(),
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

            var userId = GetCurrentUserId();
            var userName = GetCurrentUserName();
            var userEmail = GetCurrentUserEmail();
            var isAdmin = HasAdminAccess(User);

            if (book.OwnerId != userId && !isAdmin)
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Nemáte oprávnění měnit stav tohoto inzerátu.");
            }


            var previousStatus = book.SaleStatus;
            book.SaleStatus = newStatus;
            book.LastUpdatedAt = DateTime.UtcNow;

            if (previousStatus != newStatus)
            {
                var details = newStatus == SaleStatus.Archived
                    ? "Majitel inzerátu ho ručně archivoval."
                    : $"Majitel inzerátu změnil stav z {previousStatus} na {newStatus}.";

                AddBookActivityLog(
                    book.Id,
                    "ChangeStatus",
                    details,
                    userName,
                    userEmail);
            }

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
        [EnableRateLimiting("UserBasedReservation")]
        public async Task<IActionResult> ReserveBook(int id)
        {
            var userId = GetCurrentUserId();
            var userEmail = GetCurrentUserEmail();
            var userNameRaw = GetCurrentUserName();

            var userName = BookHelpers.ResolveUserName(userNameRaw, userEmail, fallback: string.Empty);

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

            book.LastUpdatedAt = DateTime.UtcNow;

            AddBookActivityLog(
                book.Id,
                "Reserve",
                $"Inzerát rezervoval uživatel {userName} ({userEmail}).",
                userName,
                userEmail);

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
        [EnableRateLimiting("UserBasedAdUpdate")]
        public async Task<IActionResult> UpdateBook(int id, [FromForm] CreateBookDTO dto, [FromServices] ImageProcessingQueue imageQueue)
        {
            var book = await _context.Books
                .Include(b => b.Tags)
                 .FirstOrDefaultAsync(b => b.Id == id);
            if (book == null)
            {
                return NotFound("Inzerát nebyl nalezen.");
            }
            var userId = GetCurrentUserId();

            var userName = GetCurrentUserName();
            var userEmail = GetCurrentUserEmail();

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
                if (!BookHelpers.IsSupportedPhotoUpload(dto.Photo.ContentType, dto.Photo.FileName))
                {
                    return BadRequest("Nepodporovaný formát fotky.");
                }

                using var memoryStream = new MemoryStream();
                await dto.Photo.CopyToAsync(memoryStream);
                var rawImageBytes = memoryStream.ToArray();

                await imageQueue.EnqueueAsync(new ImageProcessingJob(book.Id, rawImageBytes, dto.Photo.ContentType));
            }

            if (hasModeratedChanges)
            {
                AddBookActivityLog(
                    book.Id,
                    "UpdateNeedsApproval",
                    "Uživatel upravil inzerát (název/popis/fotku), proto byl vrácen do stavu čekající na schválení.",
                    userName,
                    userEmail);
            }
            else
            {
                AddBookActivityLog(
                    book.Id,
                    "Update",
                    "Uživatel upravil inzerát bez změn vyžadujících nové schválení.",
                    userName,
                    userEmail);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpGet("my")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<BookDto>>> GetMyBooks()
        {
            await ArchiveExpiredReservedBooksAsync(DateTime.UtcNow);

            var userId = GetCurrentUserId();

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
                    Tags = b.Tags.Select(t => new TagDTO
                    {
                        Name = t.Name,
                        BgColor = t.BgColor ?? "#e5e7eb",
                        TextColor = t.TextColor ?? "#111827"
                    }).ToList(),
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
            var adminName = GetCurrentUserName();
            var adminEmail = GetCurrentUserEmail();

            if (book == null) return NotFound("Inzerát nebyl nalezen.");
            if (book.SaleStatus != SaleStatus.Pending) return BadRequest("Inzerát není ve stavu čekající na schválení.");

            book.SaleStatus = SaleStatus.Available;
            book.LastUpdatedAt = DateTime.UtcNow;

            AddBookActivityLog(
                id,
                "Approve",
                "Inzerát schválen administrátorem.",
                adminName,
                adminEmail);

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

            var adminName = GetCurrentUserName();
            var adminEmail = GetCurrentUserEmail();

            book.SaleStatus = SaleStatus.Rejected;
            book.LastUpdatedAt = DateTime.UtcNow;

            AddBookActivityLog(
                id,
                "Reject",
                "Inzerát zamítnut administrátorem.",
                adminName,
                adminEmail);
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

        [HttpDelete("{id}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null) return NotFound("Inzerát nebyl nalezen.");


            AddBookActivityLog(
                id,
                "Delete",
                $"Inzerát '{book.Title}' (#{id}) byl smazán administrátorem.",
                GetCurrentUserName(),
                GetCurrentUserEmail());
            await _context.SaveChangesAsync();
            _context.Books.Remove(book);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

