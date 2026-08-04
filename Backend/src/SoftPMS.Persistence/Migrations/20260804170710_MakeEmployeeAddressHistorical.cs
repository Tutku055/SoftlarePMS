using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MakeEmployeeAddressHistorical : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "IsPrimary",
                table: "EmployeeAddresses",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "EmployeeAddresses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "EmployeeAddresses",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAddresses_EmployeeId_EndDate",
                table: "EmployeeAddresses",
                columns: new[] { "EmployeeId", "EndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAddresses_EmployeeId_IsPrimary",
                table: "EmployeeAddresses",
                columns: new[] { "EmployeeId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeAddresses_StartDate",
                table: "EmployeeAddresses",
                column: "StartDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeAddresses_EmployeeId_EndDate",
                table: "EmployeeAddresses");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeAddresses_EmployeeId_IsPrimary",
                table: "EmployeeAddresses");

            migrationBuilder.DropIndex(
                name: "IX_EmployeeAddresses_StartDate",
                table: "EmployeeAddresses");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "EmployeeAddresses");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "EmployeeAddresses");

            migrationBuilder.AlterColumn<bool>(
                name: "IsPrimary",
                table: "EmployeeAddresses",
                type: "bit",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldDefaultValue: false);
        }
    }
}
