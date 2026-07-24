using MediatR;

namespace SoftPMS.Application.Features.EmployeeReferences.Commands.DeleteEmployeeReference;

public record DeleteEmployeeReferenceCommand(Guid ReferenceId) : IRequest;
