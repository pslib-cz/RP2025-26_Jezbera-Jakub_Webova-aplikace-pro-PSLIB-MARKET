using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class BookReservation
    {
        public int Id { get; set; }
        public string ReservedByUserId { get; set; } = string.Empty;
        public string ReservedByUserName { get; set; } = string.Empty;
        public string ReservedByUserEmail { get; set; } = string.Empty;
        public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

        public int BookId { get; set; }
    }
}
