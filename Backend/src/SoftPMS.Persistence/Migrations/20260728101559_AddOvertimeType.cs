using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOvertimeType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OvertimeTypeId",
                table: "TimesheetEntries",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "OvertimeTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Multiplier = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OvertimeTypes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TimesheetEntries_OvertimeTypeId",
                table: "TimesheetEntries",
                column: "OvertimeTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimesheetEntries_OvertimeTypes_OvertimeTypeId",
                table: "TimesheetEntries",
                column: "OvertimeTypeId",
                principalTable: "OvertimeTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimesheetEntries_OvertimeTypes_OvertimeTypeId",
                table: "TimesheetEntries");

            migrationBuilder.DropTable(
                name: "OvertimeTypes");

            migrationBuilder.DropIndex(
                name: "IX_TimesheetEntries_OvertimeTypeId",
                table: "TimesheetEntries");

            migrationBuilder.DropColumn(
                name: "OvertimeTypeId",
                table: "TimesheetEntries");
        }
    }
}
