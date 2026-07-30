using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVacationDaysLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "VacationDaysTotal",
                table: "Employees",
                newName: "CarriedOverLeaves");

            migrationBuilder.AddColumn<int>(
                name: "AnnualVacationDays",
                table: "Employees",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnnualVacationDays",
                table: "Employees");

            migrationBuilder.RenameColumn(
                name: "CarriedOverLeaves",
                table: "Employees",
                newName: "VacationDaysTotal");
        }
    }
}
