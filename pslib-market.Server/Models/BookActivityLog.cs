using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class BookActivityLog
    {
        public int Id { get; set; }
        public int BookId { get; set; } 
        public Book? Book { get; set; }

        public string UserId { get; set; } = string.Empty;

        [Required]
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;


    }
}
