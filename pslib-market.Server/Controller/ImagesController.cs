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

        [HttpPost]
        public async Task<ActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }


            using var memoryStream = new MemoryStream();

            using (var image = await SixLabors.ImageSharp.Image.LoadAsync(file.OpenReadStream()))
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(1600, 1600)
                }));

                await image.SaveAsJpegAsync(memoryStream, new JpegEncoder { Quality = 80 });
            }

            var newImage = new pslib_market.Server.Models.Image
            {
                OriginalName = file.FileName,
                ContentType = "image/jpeg",
                Blob = memoryStream.ToArray(),
                UploadedAt = DateTime.UtcNow
            };

            _context.Images.Add(newImage);
            await _context.SaveChangesAsync();

            return Ok(new { imageId = newImage.Id });
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