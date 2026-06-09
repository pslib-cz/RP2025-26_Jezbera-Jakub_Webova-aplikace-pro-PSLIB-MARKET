using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pslib_market.Server.Migrations
{
    /// <inheritdoc />
    public partial class ActivityLogSetNullOnDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookActivityLogs_Books_BookId",
                table: "BookActivityLogs");

            migrationBuilder.AlterColumn<int>(
                name: "BookId",
                table: "BookActivityLogs",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_BookActivityLogs_Books_BookId",
                table: "BookActivityLogs",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BookActivityLogs_Books_BookId",
                table: "BookActivityLogs");

            migrationBuilder.AlterColumn<int>(
                name: "BookId",
                table: "BookActivityLogs",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BookActivityLogs_Books_BookId",
                table: "BookActivityLogs",
                column: "BookId",
                principalTable: "Books",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
