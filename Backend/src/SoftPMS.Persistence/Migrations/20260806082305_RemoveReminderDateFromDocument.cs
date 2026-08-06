using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveReminderDateFromDocument : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReminderDate",
                table: "Documents");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReminderDate",
                table: "Documents",
                type: "datetime2",
                nullable: true);
        }
    }
}
