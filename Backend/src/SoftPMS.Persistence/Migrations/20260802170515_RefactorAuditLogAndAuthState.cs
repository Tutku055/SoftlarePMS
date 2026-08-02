using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftPMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorAuditLogAndAuthState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ChangedByUsername",
                table: "AuditLogs",
                newName: "ChangedByEmail");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_ChangedByUsername",
                table: "AuditLogs",
                newName: "IX_AuditLogs_ChangedByEmail");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ChangedByEmail",
                table: "AuditLogs",
                newName: "ChangedByUsername");

            migrationBuilder.RenameIndex(
                name: "IX_AuditLogs_ChangedByEmail",
                table: "AuditLogs",
                newName: "IX_AuditLogs_ChangedByUsername");
        }
    }
}
