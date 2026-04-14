namespace pslib_market.Server.Models
{
    public class BookReservation
    {
        public int Id { get; set; }
        public string ReservedByUserId { get; set; } = string.Empty;
        public string ReservedByUserName { get; set; } 
        public string ReservedByUserEmail { get; set; }
        public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

        public int BookId { get; set; }
    }
}
