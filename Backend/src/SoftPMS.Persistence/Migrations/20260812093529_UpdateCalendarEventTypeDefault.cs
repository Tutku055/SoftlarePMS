using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCalendarEventTypeDefault : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "EventType",
                table: "CalendarEvents",
                type: "int",
                nullable: false,
                defaultValue: 1,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql(@"
                UPDATE CalendarEvents
                SET EventType = CASE
                    WHEN CAST(StartTime AS DATE) <> CAST(EndTime AS DATE) THEN 3
                    ELSE 1
                END
                WHERE EventType = 0;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "EventType",
                table: "CalendarEvents",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldDefaultValue: 1);
        }
    }
}
