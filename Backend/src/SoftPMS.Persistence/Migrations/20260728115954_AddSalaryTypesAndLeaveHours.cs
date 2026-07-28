using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSalaryTypesAndLeaveHours : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PaidLeaveHours",
                table: "TimesheetEntries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "UnpaidLeaveHours",
                table: "TimesheetEntries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "WorkedHours",
                table: "TimesheetEntries",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "SalaryTypes",
                table: "PayrollSlips",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaidLeaveHours",
                table: "TimesheetEntries");

            migrationBuilder.DropColumn(
                name: "UnpaidLeaveHours",
                table: "TimesheetEntries");

            migrationBuilder.DropColumn(
                name: "WorkedHours",
                table: "TimesheetEntries");

            migrationBuilder.DropColumn(
                name: "SalaryTypes",
                table: "PayrollSlips");
        }
    }
}
