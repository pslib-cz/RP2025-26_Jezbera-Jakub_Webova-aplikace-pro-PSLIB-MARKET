using Microsoft.AspNetCore.Mvc;
using pslib_market.Server.Data;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Models;
using Microsoft.AspNetCore.Authorization;


namespace pslib_market.Server.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TagsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TagsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<string>>> GetTags()
        {
            var tags = await _context.Tags.ToListAsync();
            return Ok(tags);
        }

        [HttpPost]
        public async Task<ActionResult<Tag>> PostTag(Tag tag)
        {
            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTags), new { id = tag.Id }, tag);
        }


    }
}
