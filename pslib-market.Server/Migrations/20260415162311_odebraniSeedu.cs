using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace pslib_market.Server.Migrations
{
    /// <inheritdoc />
    public partial class odebraniSeedu : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookReservation_Books_BookId",
                table: "BookReservation");

            migrationBuilder.DropForeignKey(
                name: "FK_Books_Images_ImageId",
                table: "Books");

            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropIndex(
                name: "IX_Books_ImageId",
                table: "Books");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BookReservation",
                table: "BookReservation");

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

            migrationBuilder.DropColumn(
                name: "ImageId",
                table: "Books");

            migrationBuilder.RenameTable(
                name: "BookReservation",
                newName: "BookReservations");

            migrationBuilder.RenameIndex(
                name: "IX_BookReservation_BookId",
                table: "BookReservations",
                newName: "IX_BookReservations_BookId");

            migrationBuilder.AddColumn<int>(
                name: "Condition",
                table: "Books",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<byte[]>(
                name: "ImageBlob",
                table: "Books",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.AddColumn<string>(
                name: "ImageContentType",
                table: "Books",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_BookReservations",
                table: "BookReservations",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BookReservations_Books_BookId",
                table: "BookReservations",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookReservations_Books_BookId",
                table: "BookReservations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BookReservations",
                table: "BookReservations");

            migrationBuilder.DropColumn(
                name: "Condition",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "ImageBlob",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "ImageContentType",
                table: "Books");

            migrationBuilder.RenameTable(
                name: "BookReservations",
                newName: "BookReservation");

            migrationBuilder.RenameIndex(
                name: "IX_BookReservations_BookId",
                table: "BookReservation",
                newName: "IX_BookReservation_BookId");

            migrationBuilder.AddColumn<int>(
                name: "ImageId",
                table: "Books",
                type: "integer",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_BookReservation",
                table: "BookReservation",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Blob = table.Column<byte[]>(type: "bytea", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    OriginalName = table.Column<string>(type: "text", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Books",
                columns: new[] { "Id", "CreatedAt", "Description", "ImageId", "LastUpdatedAt", "OwnerEmail", "OwnerId", "OwnerName", "Price", "SaleStatus", "Title" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "", "user1", "", 299m, 0, "Dějepis pro střední školy" },
                    { 2, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "", "user2", "", 199m, 1, "Němčina pro střední školy" },
                    { 3, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), null, null, new DateTime(2026, 1, 1, 12, 0, 0, 0, DateTimeKind.Utc), "", "user3", "", 399m, 2, "Elektrotechnika pro střední školy" }
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

            migrationBuilder.CreateIndex(
                name: "IX_Books_ImageId",
                table: "Books",
                column: "ImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_BookReservation_Books_BookId",
                table: "BookReservation",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Images_ImageId",
                table: "Books",
                column: "ImageId",
                principalTable: "Images",
                principalColumn: "Id");
        }
    }
}
