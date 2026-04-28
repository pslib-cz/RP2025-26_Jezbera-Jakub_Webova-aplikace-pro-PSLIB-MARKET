using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class Tag
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public string BgColor { get; set; } = "38BDF8";
        public string TextColor { get; set; } = "#FFFFFF";

        public ICollection<Book> Books { get; set; } = new List<Book>();

    }
}
