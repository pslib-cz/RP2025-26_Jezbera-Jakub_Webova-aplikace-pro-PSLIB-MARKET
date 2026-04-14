namespace pslib_market.Server.Models
{
    public class CreateBookDTO
    {
        public string Title { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Condition { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public IFormFile Photo { get; set; }

    }
}
