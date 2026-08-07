using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCalendarModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalendarEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    StartTime = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EndTime = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ReminderThresholdDays = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    SendEmailReminder = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CalendarNotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NoteDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ColorCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "#3B82F6"),
                    VisibilityLevel = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CalendarNotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CalendarSettings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HolidayCountryCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "TR"),
                    HolidayReminderDays = table.Column<int>(type: "int", nullable: false, defaultValue: 3),
                    SendEmailForHolidays = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    BirthdayReminderDays = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    SendEmailForBirthdays = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendarSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EventReminderTrackers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReferenceKey = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    SentAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventReminderTrackers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_StartTime_EndTime",
                table: "CalendarEvents",
                columns: new[] { "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarNotes_NoteDate_UserId",
                table: "CalendarNotes",
                columns: new[] { "NoteDate", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_CalendarNotes_UserId",
                table: "CalendarNotes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventReminderTrackers_ReferenceKey",
                table: "EventReminderTrackers",
                column: "ReferenceKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CalendarEvents");

            migrationBuilder.DropTable(
                name: "CalendarNotes");

            migrationBuilder.DropTable(
                name: "CalendarSettings");

            migrationBuilder.DropTable(
                name: "EventReminderTrackers");
        }
    }
}
