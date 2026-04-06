using pslib_market.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class Book
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdatedAt { get; set;  } = DateTime.UtcNow;

        [Required]
        public string OwnerId { get; set; }
        public SaleStatus SaleStatus { get; set; } = SaleStatus.Available;

        public BookCondition Condition { get; set; } 

        public int? ImageId { get; set; }
        public Image? Image { get; set; }
        public ICollection<Tag> Tags { get; set; } = new List<Tag>();

        public string? ReservedById { get; set; }








    }
}
