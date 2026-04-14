using pslib_market.Server.Models.Enums;

namespace pslib_market.Server.Models
{
    public class BookDto
    {
            public int Id { get; set; }
            public string Title { get; set; }
            public decimal Price { get; set; }
            public List<string> Tags { get; set; }
        public string OwnerId { get; set; }
         public SaleStatus SaleStatus { get; set; }
        public int? ImageId { get; set; }
    }
}
