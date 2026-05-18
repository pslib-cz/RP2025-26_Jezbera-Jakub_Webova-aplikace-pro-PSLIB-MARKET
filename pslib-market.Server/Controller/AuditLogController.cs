using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Models;


namespace pslib_market.Server.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "AdminOnly")]
    public class AuditLogController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuditLogController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<BookActivityLog>>> GetLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(page, 1);

            var query = _context.BookActivityLogs
                .Include(log => log.Book)
                .AsQueryable();

            var totalCount = await query.CountAsync();
            var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);
            page = Math.Min(page, totalPages);

            var logs = await query
                .OrderByDescending(log => log.TimeStamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<BookActivityLog>
            {
                Items = logs,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }



    }
}
