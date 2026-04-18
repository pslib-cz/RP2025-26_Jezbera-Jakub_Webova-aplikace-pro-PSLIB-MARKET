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
        public async Task<ActionResult<IEnumerable<BookActivityLog>>> GetLogs()
        {
            var logs = await _context.BookActivityLogs
                .Include(log => log.Book)
                .OrderByDescending(log => log.TimeStamp)
                .Take(100)
                .ToListAsync();
            return Ok(logs);
        }



    }
}
