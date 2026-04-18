using Microsoft.AspNetCore.Mvc;
using pslib_market.Server.Data;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Models;
using Microsoft.AspNetCore.Authorization;


namespace pslib_market.Server.Controller
{
    [Route("api/[controller]")]
    [ApiController]

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
            var tags = await _context.Tags.Select(t => t.Name).ToListAsync();
            return Ok(tags);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<Tag>> CreateTag([FromBody] string tagName)
        {
            if(string.IsNullOrEmpty(tagName)) return BadRequest("Název tagu nesmí být prázdný.");
            tagName = tagName.Trim();

            bool tagExists = await _context.Tags.AnyAsync(t => t.Name.ToLower() == tagName.ToLower());
            if (tagExists) return BadRequest("Tag s tímto názvem již existuje.");

            var newTag = new Tag { Name = tagName };
            _context.Tags.Add(newTag);
            await _context.SaveChangesAsync();
            return Ok(newTag);


        }


    }
}
