using Microsoft.AspNetCore.Mvc;
using pslib_market.Server.Data;
using pslib_market.Server.Models;

namespace pslib_market.Server.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImagesController : ControllerBase
    {

        private readonly ApplicationDbContext _context;

        public ImagesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            if (file.Length > 5 * 1024 * 1024) // 5MB limit
            {
                return BadRequest("File size exceeds the 5MB limit.");
            }

            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);

            var newImage = new Image
            {
                OriginalName = file.FileName,
                ContentType = file.ContentType,
                Blob = memoryStream.ToArray(),
                UploadedAt = DateTime.UtcNow
            };

            _context.Images.Add(newImage);
            await _context.SaveChangesAsync();

            return Ok(new { imageId = newImage.Id });


        }

        [HttpGet("{id}")]
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