using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Data;
using pslib_market.Server.Models;
using System.Text.RegularExpressions;

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
        public async Task<ActionResult<IEnumerable<TagDTO>>> GetTags()
        {
            var tags = await _context.Tags
                .Select(t => new TagDTO
                {
                    Name = t.Name,
                    BgColor = t.BgColor,
                    TextColor = t.TextColor
                })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost]
        [Authorize(Policy = "AdminOnly")]
        public async Task<ActionResult<Tag>> CreateTag([FromBody] TagDTO tagDto)
        {
            if (string.IsNullOrWhiteSpace(tagDto.Name))
                return BadRequest("Název tagu nesmí být prázdný.");

            var tagName = tagDto.Name.Trim();

            var hexRegex = new Regex("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");

            var bgColor = !string.IsNullOrWhiteSpace(tagDto.BgColor) && hexRegex.IsMatch(tagDto.BgColor)
                ? tagDto.BgColor
                : "#38BDF8";

            var textColor = !string.IsNullOrWhiteSpace(tagDto.TextColor) && hexRegex.IsMatch(tagDto.TextColor)
                ? tagDto.TextColor
                : "#FFFFFF";

            bool tagExists = await _context.Tags.AnyAsync(t => t.Name.ToLower() == tagName.ToLower());
            if (tagExists) return BadRequest("Tag s tímto názvem již existuje.");

            var newTag = new Tag
            {
                Name = tagName,
                BgColor = bgColor,
                TextColor = textColor
            };

            _context.Tags.Add(newTag);
            await _context.SaveChangesAsync();
            return Ok(newTag);
        }

        [HttpPut("{currentName}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpdateTag(string currentName, [FromBody] TagDTO tagDto)
        {
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == currentName.ToLower());
            if (tag == null) return NotFound("Původní tag nebyl nalezen.");

            var newName = tagDto.Name.Trim();

            if (!string.Equals(tag.Name, newName, StringComparison.OrdinalIgnoreCase))
            {
                if (await _context.Tags.AnyAsync(t => t.Name.ToLower() == newName.ToLower()))
                    return BadRequest("Tag s tímto novým názvem již existuje.");
            }

            var hexRegex = new Regex("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");

            tag.Name = newName;
            tag.BgColor = !string.IsNullOrWhiteSpace(tagDto.BgColor) && hexRegex.IsMatch(tagDto.BgColor) ? tagDto.BgColor : tag.BgColor;
            tag.TextColor = !string.IsNullOrWhiteSpace(tagDto.TextColor) && hexRegex.IsMatch(tagDto.TextColor) ? tagDto.TextColor : tag.TextColor;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{name}")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> DeleteTag(string name)
        {
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());
            if (tag == null) return NotFound("Tag nebyl nalezen.");

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}