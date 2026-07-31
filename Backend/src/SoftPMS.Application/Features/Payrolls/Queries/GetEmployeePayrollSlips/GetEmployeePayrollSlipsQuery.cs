using MediatR;
using SoftPMS.Application.Features.Payrolls.DTOs;
using System;
using System.Collections.Generic;

namespace SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;

public record GetEmployeePayrollSlipsQuery(Guid EmployeeId) : IRequest<List<PayrollSlipDto>>;
