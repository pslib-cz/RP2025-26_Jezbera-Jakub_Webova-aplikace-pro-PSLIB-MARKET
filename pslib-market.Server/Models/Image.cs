using System.ComponentModel.DataAnnotations;

namespace pslib_market.Server.Models
{
    public class Image
    {

        public int Id { get; set; }

        [Required]
        public string OriginalName { get; set; } = string.Empty;

        [Required]
        public string ContentType { get; set; } = string.Empty;
        [Required]
        public byte[] Blob { get; set; } = Array.Empty<byte>();

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    }
}
