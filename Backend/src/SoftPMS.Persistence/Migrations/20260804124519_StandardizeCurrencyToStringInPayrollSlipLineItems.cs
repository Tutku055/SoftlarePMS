using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StandardizeCurrencyToStringInPayrollSlipLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "PayrollSlipLineItems",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql(@"
                UPDATE [PayrollSlipLineItems]
                SET [Currency] = CASE [Currency]
                    WHEN '1' THEN 'TRY'
                    WHEN '2' THEN 'USD'
                    WHEN '3' THEN 'EUR'
                    WHEN '4' THEN 'GBP'
                    ELSE 'TRY'
                END;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE [PayrollSlipLineItems]
                SET [Currency] = CASE [Currency]
                    WHEN 'TRY' THEN '1'
                    WHEN 'USD' THEN '2'
                    WHEN 'EUR' THEN '3'
                    WHEN 'GBP' THEN '4'
                    ELSE '1'
                END;
            ");

            migrationBuilder.AlterColumn<int>(
                name: "Currency",
                table: "PayrollSlipLineItems",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
