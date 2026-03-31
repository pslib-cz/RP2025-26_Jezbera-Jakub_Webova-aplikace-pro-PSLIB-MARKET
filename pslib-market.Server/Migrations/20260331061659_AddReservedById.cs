using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pslib_market.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddReservedById : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReservedById",
                table: "Books",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReservedById",
                table: "Books");
        }
    }
}
