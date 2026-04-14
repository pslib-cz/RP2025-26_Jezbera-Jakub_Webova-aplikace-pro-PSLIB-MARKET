using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pslib_market.Server.Migrations
{
    /// <inheritdoc />
    public partial class addownerinfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OwnerEmail",
                table: "Books",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OwnerName",
                table: "Books",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "OwnerEmail", "OwnerName" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "OwnerEmail", "OwnerName" },
                values: new object[] { "", "" });

            migrationBuilder.UpdateData(
                table: "Books",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "OwnerEmail", "OwnerName" },
                values: new object[] { "", "" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OwnerEmail",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "OwnerName",
                table: "Books");
        }
    }
}
