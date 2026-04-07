using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Models;
using pslib_market.Server.Models.Enums;


namespace pslib_market.Server.Controller
{

    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BooksController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
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
                    Tags = b.Tags.Select(t => t.Name).ToList()
                })
                .ToListAsync();

            return Ok(books);
        }

        [HttpPost]
        public async Task<ActionResult<Book>> CreateBook(Book book)
        {
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
