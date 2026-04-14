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
                .Where(b => !(b.SaleStatus == SaleStatus.Reserved && b.LastUpdatedAt < oneMonthAgo))
                .Where(b => !(b.SaleStatus == SaleStatus.Archived && b.LastUpdatedAt < twoYearsAgo))
                .OrderBy(b => b.SaleStatus == SaleStatus.Archived ? 1 : 0)
                .ThenByDescending(b => b.CreatedAt)
                .Select(b => new BookDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Price = b.Price,
                    OwnerId = b.OwnerId,
                    SaleStatus = b.SaleStatus,
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    ImageId = b.ImageId
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

            if ( string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userEmail) || string.IsNullOrEmpty(userName))
            {
                return Unauthorized("Neplatné uživatelské údaje.");
            }

            byte[] imageBytes = null;
            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                using var ms = new MemoryStream();
                using ( var image = await SixLabors.ImageSharp.Image.LoadAsync(dto.Photo.OpenReadStream()))
                {
                    image.Mutate(x => x.Resize(new ResizeOptions
                    {
                        Mode = ResizeMode.Max,
                        Size = new Size(800, 800)
                    }));
                    await image.SaveAsJpegAsync(ms, new JpegEncoder { Quality = 75 });
                }
            }


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

                Image = imageBytes != null ? new Models.Image
                {
                    OriginalName = dto.Photo.FileName,
                    ContentType = "image/jpeg",
                    Blob = imageBytes,
                    UploadedAt = DateTime.UtcNow
                } : null
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, Book book)
        {
            if (id != book.Id)
            {
                return BadRequest("Id se neshoduje");
            }
            _context.Entry(book).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Books.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            return NoContent();
        }


        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ChangeStatus(int id, [FromBody] SaleStatus newStatus)
        {
            var book = await _context.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound("Inzerát nebyl nalezen.");
            }

            book.SaleStatus = newStatus;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }



}

