using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace pslib_market.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddDummyDataFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Condition",
                table: "Books");

            migrationBuilder.InsertData(
                table: "Books",
                columns: new[] { "Id", "CreatedAt", "Description", "ImageId", "LastUpdatedAt", "OwnerId", "Price", "ReservedById", "SaleStatus", "Title" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "user1", 299m, null, 0, "Dějepis pro střední školy" },
                    { 2, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "user2", 199m, null, 1, "Němčina pro střední školy" },
                    { 3, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "user3", 399m, null, 2, "Elektrotechnika pro střední školy" }
                });

            migrationBuilder.InsertData(
                table: "BookTag",
                columns: new[] { "BooksId", "TagsId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 2, 2 },
                    { 3, 3 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "BookTag",
                keyColumns: new[] { "BooksId", "TagsId" },
                keyValues: new object[] { 1, 1 });

            migrationBuilder.DeleteData(
                table: "BookTag",
                keyColumns: new[] { "BooksId", "TagsId" },
                keyValues: new object[] { 2, 2 });

            migrationBuilder.DeleteData(
                table: "BookTag",
                keyColumns: new[] { "BooksId", "TagsId" },
                keyValues: new object[] { 3, 3 });

            migrationBuilder.DeleteData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.AddColumn<int>(
                name: "Condition",
                table: "Books",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
