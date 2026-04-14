using Microsoft.AspNetCore.Mvc;
using pslib_market.Server.Data;
using pslib_market.Server.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;
using Microsoft.AspNetCore.Authorization;

namespace pslib_market.Server.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ImagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ImagesController(ApplicationDbContext context)
        {
            _context = context;
        }

       

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult> GetImage(int id)
        {
            var image = await _context.Images.FindAsync(id);
            if (image == null)
            {
                return NotFound();
            }
            return File(image.Blob, image.ContentType, image.OriginalName);
        }
    }
}