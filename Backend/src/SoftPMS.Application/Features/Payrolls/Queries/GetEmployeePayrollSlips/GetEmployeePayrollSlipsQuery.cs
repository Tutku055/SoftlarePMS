using MediatR;
using SoftPMS.Application.Features.Payrolls.DTOs;
using System;
using System.Collections.Generic;

namespace SoftPMS.Application.Features.Payrolls.Queries.GetEmployeePayrollSlips;

/// <summary>
/// Represents the Query to get employee payroll slips.
/// </summary>
public record GetEmployeePayrollSlipsQuery(Guid EmployeeId) : IRequest<List<PayrollSlipDto>>;


