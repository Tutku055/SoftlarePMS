using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SingleCompensation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeCompensations_EmployeeId_EndDate",
                table: "EmployeeCompensations");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "EmployeeCompensations");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeCompensations_EmployeeId",
                table: "EmployeeCompensations",
                column: "EmployeeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EmployeeCompensations_EmployeeId",
                table: "EmployeeCompensations");

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "EmployeeCompensations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeCompensations_EmployeeId_EndDate",
                table: "EmployeeCompensations",
                columns: new[] { "EmployeeId", "EndDate" });
        }
    }
}
