using pslib_market.Server.Models.Enums;

namespace pslib_market.Server.Models
{
    public class BookReservationDto
    {
        public string ReservedByUserName { get; set; } = string.Empty;
        public string ReservedByUserEmail { get; set; } = string.Empty;
        public DateTime ReservedAt { get; set; }
    }

    public class BookDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public List<string> Tags { get; set; }
        public string OwnerId { get; set; }
        public string OwnerName { get; set; }
        public string OwnerEmail { get; set; }
        public SaleStatus SaleStatus { get; set; }
        public BookCondition Condition { get; set; }
        public int? ImageId { get; set; }
        public List<BookReservationDto> Reservations { get; set; } = new();
    }
}
