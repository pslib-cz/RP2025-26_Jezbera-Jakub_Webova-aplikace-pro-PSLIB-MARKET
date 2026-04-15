using Microsoft.EntityFrameworkCore;
using pslib_market.Server.Models;
using pslib_market.Server.Models.Enums;
using System;

namespace pslib_market.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }
        public DbSet<Image> Images { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<BookReservation> BookReservations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Tag>().HasData(
                new Tag { Id = 1, Name = "Dějepis" },
                new Tag { Id = 2, Name = "Němčina" },
                new Tag { Id = 3, Name = "Elektrotechnika" },
                new Tag { Id = 4, Name = "Fyzika" },
                new Tag { Id = 5, Name = "Matematika" },
                new Tag { Id = 6, Name = "Technické kreslení" },
                new Tag { Id = 7, Name = "Čeština" },
                new Tag { Id = 8, Name = "Angličtina" },
                new Tag { Id = 9, Name = "Chemie" }
            );

            modelBuilder.Entity<Book>().HasData(
                new Book
                {
                    Id = 1,
                    Title = "Dějepis pro střední školy",
                    Price = 299,
                    OwnerId = "user1",
                    SaleStatus = SaleStatus.Available,
                    CreatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    LastUpdatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    //ImageId = 1
                },
                new Book
                {
                    Id = 2,
                    Title = "Němčina pro střední školy",
                    Price = 199,
                    OwnerId = "user2",
                    SaleStatus = SaleStatus.Reserved,
                    CreatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    LastUpdatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    //ImageId = 2
                },
                new Book
                {
                    Id = 3,
                    Title = "Elektrotechnika pro střední školy",
                    Price = 399,
                    OwnerId = "user3",
                    SaleStatus = SaleStatus.Archived,
                    CreatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    LastUpdatedAt = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc),
                    //ImageId = 3
                }
            );

            modelBuilder.Entity("BookTag").HasData(
                new { BooksId = 1, TagsId = 1 },
                new { BooksId = 2, TagsId = 2 },
                new { BooksId = 3, TagsId = 3 }
            );
        }
    }
}