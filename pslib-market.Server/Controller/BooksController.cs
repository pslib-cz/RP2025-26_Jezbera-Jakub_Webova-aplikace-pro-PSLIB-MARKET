using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Models;
using pslib_market.Server.Models.Enums;
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

        public BooksController(ApplicationDbContext context)
        {
            _context = context;
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

            byte[] imageBytes = null;
            using var ms = new MemoryStream();
            using (var image = await SixLabors.ImageSharp.Image.LoadAsync(dto.Photo.OpenReadStream()))
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
                SaleStatus = SaleStatus.Available,
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
            return CreatedAtAction(nameof(GetBooks), new { id = book.Id }, book);
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

            if ( book.OwnerId != userId ) return Forbid("Nemáte oprávnění měnit stav tohoto inzerátu.");

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
            if (book.OwnerId != userId)
            {
                return Forbid("Nemáte oprávnění upravovat tento inzerát.");
            }

            book.Title = dto.Title;
            book.Description = dto.Description;
            book.Price = dto.Price;
            book.Condition = dto.Condition;
            book.LastUpdatedAt = DateTime.UtcNow;
            if (!string.IsNullOrEmpty(dto.Subject))
            {
                book.Tags.Clear();
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name == dto.Subject);
                if (tag != null )
                {
                    book.Tags.Add(tag);
                }
            }
            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                byte[] imageBytes = null;
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
                    Condition = b.Condition
                })
                .ToListAsync();
            return Ok(myBooks);


        }



    }
}

