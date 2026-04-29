using pslib_market.Server.Helpers;
using Xunit;

namespace pslib_market.Tests;

public class BookHelpersTests
{
    // ── ResolveUserName ──────────────────────────────────────────────

    [Fact]
    public void ResolveUserName_ReturnsName_WhenNameIsProvided()
    {
        var result = BookHelpers.ResolveUserName("Jan Novák", "jan@pslib.cz");
        Assert.Equal("Jan Novák", result);
    }

    [Fact]
    public void ResolveUserName_UsesEmailPrefix_WhenNameIsEmpty()
    {
        var result = BookHelpers.ResolveUserName(null, "jan.novak@pslib.cz");
        Assert.Equal("jan.novak", result);
    }

    [Fact]
    public void ResolveUserName_UsesEmailPrefix_WhenNameIsWhitespace()
    {
        var result = BookHelpers.ResolveUserName("   ", "petr@pslib.cz");
        Assert.Equal("petr", result);
    }

    [Fact]
    public void ResolveUserName_ReturnsFallback_WhenBothNullOrEmpty()
    {
        var result = BookHelpers.ResolveUserName(null, null);
        Assert.Equal("Neznámý uživatel", result);
    }

    [Fact]
    public void ResolveUserName_ReturnsFallback_WhenEmailIsEmpty()
    {
        var result = BookHelpers.ResolveUserName("", "");
        Assert.Equal("Neznámý uživatel", result);
    }

    [Fact]
    public void ResolveUserName_UsesCustomFallback()
    {
        var result = BookHelpers.ResolveUserName(null, null, fallback: "Anonym");
        Assert.Equal("Anonym", result);
    }

    [Fact]
    public void ResolveUserName_PreferNameOverEmail()
    {
        var result = BookHelpers.ResolveUserName("Jakub", "jakub@pslib.cz");
        Assert.Equal("Jakub", result);
    }

    // ── IsSupportedPhotoUpload ───────────────────────────────────────

    [Theory]
    [InlineData("image/jpeg", "foto.jpg")]
    [InlineData("image/png", "foto.png")]
    [InlineData("image/webp", "foto.webp")]
    [InlineData("image/gif", "foto.gif")]
    [InlineData("image/bmp", "foto.bmp")]
    [InlineData("image/tiff", "foto.tiff")]
    public void IsSupportedPhotoUpload_ReturnsTrue_ForSupportedContentTypes(
        string contentType, string fileName)
    {
        Assert.True(BookHelpers.IsSupportedPhotoUpload(contentType, fileName));
    }

    [Theory]
    [InlineData(null, "foto.jpg")]
    [InlineData(null, "foto.jpeg")]
    [InlineData(null, "foto.png")]
    [InlineData(null, "foto.webp")]
    [InlineData(null, "foto.tif")]
    [InlineData(null, "foto.tiff")]
    public void IsSupportedPhotoUpload_ReturnsTrue_ForSupportedExtensions(
        string? contentType, string fileName)
    {
        Assert.True(BookHelpers.IsSupportedPhotoUpload(contentType, fileName));
    }

    [Theory]
    [InlineData("application/pdf", "dokument.pdf")]
    [InlineData("text/plain", "soubor.txt")]
    [InlineData("video/mp4", "video.mp4")]
    [InlineData(null, "soubor.exe")]
    [InlineData(null, "soubor.txt")]
    public void IsSupportedPhotoUpload_ReturnsFalse_ForUnsupportedTypes(
        string? contentType, string fileName)
    {
        Assert.False(BookHelpers.IsSupportedPhotoUpload(contentType, fileName));
    }

    [Fact]
    public void IsSupportedPhotoUpload_IsCaseInsensitive()
    {
        Assert.True(BookHelpers.IsSupportedPhotoUpload("IMAGE/JPEG", "FOTO.JPG"));
        Assert.True(BookHelpers.IsSupportedPhotoUpload("Image/Png", "Foto.PNG"));
    }
}