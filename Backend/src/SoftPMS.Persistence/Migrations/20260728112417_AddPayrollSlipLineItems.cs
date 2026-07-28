using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPayrollSlipLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PayrollSlipLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayrollSlipId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemType = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollSlipLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PayrollSlipLineItems_PayrollSlips_PayrollSlipId",
                        column: x => x.PayrollSlipId,
                        principalTable: "PayrollSlips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PayrollSlipLineItems_PayrollSlipId",
                table: "PayrollSlipLineItems",
                column: "PayrollSlipId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PayrollSlipLineItems");
        }
    }
}
