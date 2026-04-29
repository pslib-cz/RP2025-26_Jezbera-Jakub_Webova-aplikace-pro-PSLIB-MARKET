using System.ComponentModel.DataAnnotations;
using pslib_market.Server.Models;
using pslib_market.Server.Models.Enums;
using Xunit;

namespace pslib_market.Tests;

public class ModelValidationTests
{
    private static List<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        var context = new ValidationContext(model);
        Validator.TryValidateObject(model, context, results, validateAllProperties: true);
        return results;
    }

    // ── Book ─────────────────────────────────────────────────────────

    [Fact]
    public void Book_IsValid_WithRequiredFields()
    {
        var book = new Book
        {
            Title = "Matematika pro SŠ",
            OwnerId = "user-123",
            ImageBlob = new byte[] { 1, 2, 3 },
            ImageContentType = "image/jpeg"
        };

        var errors = Validate(book);
        Assert.Empty(errors);
    }

    [Fact]
    public void Book_HasDefaults_OnCreation()
    {
        var book = new Book
        {
            Title = "Test",
            OwnerId = "user-1",
            ImageBlob = [],
            ImageContentType = "image/jpeg"
        };

        Assert.Equal(SaleStatus.Available, book.SaleStatus);
        Assert.Equal(BookCondition.VeryGood, book.Condition);
        Assert.Empty(book.Tags);
        Assert.Empty(book.Reservations);
        Assert.Equal(string.Empty, book.OwnerName);
    }

    [Fact]
    public void Book_FailsValidation_WhenTitleMissing()
    {
        var book = new Book
        {
            Title = null!,
            OwnerId = "user-123",
            ImageBlob = [],
            ImageContentType = "image/jpeg"
        };

        var errors = Validate(book);
        Assert.Contains(errors, e => e.MemberNames.Contains("Title"));
    }

    [Fact]
    public void Book_FailsValidation_WhenTitleTooLong()
    {
        var book = new Book
        {
            Title = new string('A', 201),
            OwnerId = "user-123",
            ImageBlob = [],
            ImageContentType = "image/jpeg"
        };

        var errors = Validate(book);
        Assert.Contains(errors, e => e.MemberNames.Contains("Title"));
    }

    [Fact]
    public void Book_AcceptsTitle_AtMaxLength()
    {
        var book = new Book
        {
            Title = new string('A', 200),
            OwnerId = "user-123",
            ImageBlob = [],
            ImageContentType = "image/jpeg"
        };

        var errors = Validate(book);
        Assert.Empty(errors);
    }

    // ── Tag ──────────────────────────────────────────────────────────

    [Fact]
    public void Tag_IsValid_WithRequiredFields()
    {
        var tag = new Tag { Name = "Matematika" };
        var errors = Validate(tag);
        Assert.Empty(errors);
    }

    [Fact]
    public void Tag_HasDefaults_OnCreation()
    {
        var tag = new Tag { Name = "Test" };
        Assert.Equal("38BDF8", tag.BgColor);
        Assert.Equal("#FFFFFF", tag.TextColor);
        Assert.Empty(tag.Books);
    }

    [Fact]
    public void Tag_FailsValidation_WhenNameTooLong()
    {
        var tag = new Tag { Name = new string('X', 51) };
        var errors = Validate(tag);
        Assert.Contains(errors, e => e.MemberNames.Contains("Name"));
    }

    [Fact]
    public void Tag_AcceptsName_AtMaxLength()
    {
        var tag = new Tag { Name = new string('X', 50) };
        var errors = Validate(tag);
        Assert.Empty(errors);
    }

    // ── CreateBookDTO ─────────────────────────────────────────────────

    [Fact]
    public void CreateBookDTO_FailsValidation_WhenDescriptionTooLong()
    {
        var dto = new CreateBookDTO
        {
            Title = "Test",
            Description = new string('X', 501),
            Condition = BookCondition.Good
        };

        var errors = Validate(dto);
        Assert.Contains(errors, e => e.MemberNames.Contains("Description"));
    }

    [Fact]
    public void CreateBookDTO_AcceptsDescription_AtMaxLength()
    {
        var dto = new CreateBookDTO
        {
            Title = "Test",
            Description = new string('X', 500),
            Condition = BookCondition.Good
        };

        var errors = Validate(dto);
        Assert.Empty(errors);
    }

    [Fact]
    public void BookValidationLimits_DescriptionMaxLength_Is500()
    {
        Assert.Equal(500, BookValidationLimits.DescriptionMaxLength);
    }
}