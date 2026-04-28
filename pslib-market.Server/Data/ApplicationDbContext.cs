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
        public DbSet<Tag> Tags { get; set; }
        public DbSet<BookReservation> BookReservations { get; set; }
        public DbSet<BookActivityLog> BookActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Tag>().HasData(
                new Tag { Id = 1, Name = "Dějepis", BgColor = "#FB923C", TextColor = "#FFFFFF" },
                new Tag { Id = 2, Name = "Němčina", BgColor = "#F87171", TextColor = "#FFFFFF" },
                new Tag { Id = 3, Name = "Elektrotechnika", BgColor = "#2DD4BF", TextColor = "#FFFFFF" },
                new Tag { Id = 4, Name = "Fyzika", BgColor = "#38BDF8", TextColor = "#FFFFFF" },
                new Tag { Id = 5, Name = "Matematika", BgColor = "#4281CE", TextColor = "#FFFFFF" },
                new Tag { Id = 6, Name = "Technické kreslení", BgColor = "#818CF8", TextColor = "#FFFFFF" },
                new Tag { Id = 7, Name = "Čeština", BgColor = "#FBBF24", TextColor = "#FFFFFF" },
                new Tag { Id = 8, Name = "Angličtina", BgColor = "#A78BFA", TextColor = "#FFFFFF" },
                new Tag { Id = 9, Name = "Chemie", BgColor = "#B075EB", TextColor = "#FFFFFF" }
            );


        }
    }
}