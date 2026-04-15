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

           
        }
    }
}