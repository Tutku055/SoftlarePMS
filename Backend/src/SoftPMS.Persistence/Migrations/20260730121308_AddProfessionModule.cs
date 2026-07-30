using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_Profession",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "Profession",
                table: "Employees");

            migrationBuilder.AddColumn<Guid>(
                name: "ProfessionId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Professions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Professions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_ProfessionId",
                table: "Employees",
                column: "ProfessionId");

            migrationBuilder.CreateIndex(
                name: "IX_Professions_Name",
                table: "Professions",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Professions_ProfessionId",
                table: "Employees",
                column: "ProfessionId",
                principalTable: "Professions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Professions_ProfessionId",
                table: "Employees");

            migrationBuilder.DropTable(
                name: "Professions");

            migrationBuilder.DropIndex(
                name: "IX_Employees_ProfessionId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "ProfessionId",
                table: "Employees");

            migrationBuilder.AddColumn<string>(
                name: "Profession",
                table: "Employees",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_Profession",
                table: "Employees",
                column: "Profession");
        }
    }
}
