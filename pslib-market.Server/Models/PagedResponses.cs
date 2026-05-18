namespace pslib_market.Server.Models
{
    public class BooksPageResponse
    {
        public required List<BookDto> Items { get; set; } = [];
        public int FilteredCount { get; set; }
        public int VisibleCount { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class PagedResult<T>
    {
        public required List<T> Items { get; set; } = [];
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}