using AutoMapper;
using SoftPMS.Application.Features.Departments.DTOs;
using SoftPMS.Application.Features.EmployeeAddresses.DTOs;
using SoftPMS.Application.Features.Employees.DTOs;
using SoftPMS.Application.Features.EmployeeCompensations.DTOs;
using SoftPMS.Application.Features.Documents.DTOs;
using SoftPMS.Application.Features.EmployeeNotes.DTOs;
using SoftPMS.Application.Features.EmployeeReferences.DTOs;
using SoftPMS.Application.Features.Permissions.DTOs;
using SoftPMS.Application.Features.Roles.DTOs;
using SoftPMS.Application.Features.Users.DTOs;
using SoftPMS.Application.Features.Professions.DTOs;
using SoftPMS.Domain.Entities;

namespace SoftPMS.Application.Mappings;

public class ApplicationMappingProfile : Profile
{
    public ApplicationMappingProfile()
    {
        // Employee mappings
        CreateMap<Employee, EmployeeDto>()
            .ForMember(d => d.ProfessionName, o => o.MapFrom(s => s.Profession != null ? s.Profession.Name : null));
        CreateMap<Employee, EmployeeDetailDto>()
            .ForMember(d => d.ProfessionName, o => o.MapFrom(s => s.Profession != null ? s.Profession.Name : null))
            .ForMember(d => d.Compensation, o => o.MapFrom(s => s.Compensations.FirstOrDefault(c => c.EndDate == null)));
        // Downcast for facade: detail -> slim DTO
        CreateMap<EmployeeDetailDto, EmployeeDto>();
        CreateMap<CreateEmployeeDto, Employee>();
        CreateMap<UpdateEmployeeDto, Employee>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());

        // Employee address mappings
        CreateMap<EmployeeAddress, SoftPMS.Application.Features.EmployeeAddresses.DTOs.EmployeeAddressDto>()
            .ForMember(d => d.IsCurrent, o => o.MapFrom(s => s.EndDate == null || s.EndDate >= DateTime.UtcNow.Date));
        CreateMap<EmployeeAddress, SoftPMS.Application.Features.Employees.DTOs.EmployeeAddressDto>()
            .ForMember(d => d.IsCurrent, o => o.MapFrom(s => s.EndDate == null || s.EndDate >= DateTime.UtcNow.Date));
        CreateMap<SoftPMS.Application.Features.EmployeeAddresses.DTOs.CreateEmployeeAddressDto, EmployeeAddress>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<SoftPMS.Application.Features.Employees.DTOs.CreateEmployeeAddressDto, EmployeeAddress>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<SoftPMS.Application.Features.EmployeeAddresses.DTOs.UpdateEmployeeAddressDto, EmployeeAddress>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<SoftPMS.Application.Features.Employees.DTOs.UpdateEmployeeAddressDto, EmployeeAddress>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());

        // Department mappings
        CreateMap<Department, DepartmentDto>()
            .ForCtorParam("EmployeeCount", o => o.MapFrom(s => s.Employees.Count));
        CreateMap<Department, DepartmentLookupDto>();

        // Profession mappings
        CreateMap<Profession, ProfessionDto>()
            .ForCtorParam("EmployeeCount", o => o.MapFrom(s => s.Employees.Count));
        CreateMap<Profession, ProfessionLookupDto>();
        CreateMap<CreateProfessionDto, Profession>();
        CreateMap<UpdateProfessionDto, Profession>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());

        // Employee compensation mappings
        CreateMap<EmployeeCompensation, EmployeeCompensationDto>()
            .ForMember(d => d.IsActive, o => o.MapFrom(s => true));
        CreateMap<CreateEmployeeCompensationDto, EmployeeCompensation>()
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.CreatedByUserId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore())
            .ForMember(d => d.CreatedByUser, o => o.Ignore());
        CreateMap<UpdateEmployeeCompensationDto, EmployeeCompensation>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.CreatedByUserId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore())
            .ForMember(d => d.CreatedByUser, o => o.Ignore());

        // Document mappings
        CreateMap<Document, DocumentDto>();
        // Employee note mappings
        CreateMap<EmployeeNote, EmployeeNoteDto>();
        CreateMap<CreateEmployeeNoteDto, EmployeeNote>()
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.CreatedByUserId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore())
            .ForMember(d => d.CreatedByUser, o => o.Ignore());
        CreateMap<UpdateEmployeeNoteDto, EmployeeNote>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.CreatedByUserId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore())
            .ForMember(d => d.CreatedByUser, o => o.Ignore());

        // Employee reference mappings
        CreateMap<EmployeeReference, EmployeeReferenceDto>()
            .ForMember(d => d.FullName, o => o.MapFrom(s => s.ContactPerson))
            .ForMember(d => d.Company, o => o.MapFrom(s => s.CompanyName))
            .ForMember(d => d.Title, o => o.MapFrom(s => s.Title))
            .ForMember(d => d.PhoneNumber, o => o.MapFrom(s => s.Phone));
        CreateMap<CreateEmployeeReferenceDto, EmployeeReference>()
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company))
            .ForMember(d => d.ContactPerson, o => o.MapFrom(s => s.FullName))
            .ForMember(d => d.Title, o => o.MapFrom(s => s.Title))
            .ForMember(d => d.Phone, o => o.MapFrom(s => s.PhoneNumber))
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());
        CreateMap<UpdateEmployeeReferenceDto, EmployeeReference>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.CompanyName, o => o.MapFrom(s => s.Company))
            .ForMember(d => d.ContactPerson, o => o.MapFrom(s => s.FullName))
            .ForMember(d => d.Title, o => o.MapFrom(s => s.Title))
            .ForMember(d => d.Phone, o => o.MapFrom(s => s.PhoneNumber))
            .ForMember(d => d.EmployeeId, o => o.Ignore())
            .ForMember(d => d.Employee, o => o.Ignore());

        // Role mappings
        CreateMap<Role, RoleDto>()
            .ForMember(d => d.UserCount, o => o.MapFrom(s => s.Users.Count(u => !u.IsDeleted)))
            .ForMember(d => d.PermissionIds, o => o.MapFrom(s => s.RolePermissions.Select(rp => rp.PermissionId).ToList()))
            .ReverseMap();
        CreateMap<Role, RoleListDto>()
            .ForCtorParam("UserCount", o => o.MapFrom(s => s.Users.Count(u => !u.IsDeleted)));
        CreateMap<CreateRoleDto, Role>();
        CreateMap<UpdateRoleDto, Role>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());

        // Permission mappings
        CreateMap<Permission, PermissionDto>().ReverseMap();
        CreateMap<CreatePermissionDto, Permission>();
        CreateMap<UpdatePermissionDto, Permission>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());

        // User mappings
        CreateMap<User, UserDto>().ReverseMap();
        CreateMap<CreateUserDto, User>();
        CreateMap<UpdateUserDto, User>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());
    }
}
