using pslib_market.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class CreateBookDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }

        [Required]
        public BookCondition Condition { get; set; }

        public IFormFile? Photo { get; set; }

    }
}
