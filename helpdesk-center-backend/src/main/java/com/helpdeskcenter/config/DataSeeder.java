package com.helpdeskcenter.config;

import com.helpdeskcenter.entities.Company;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.CompanyRepository;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void seedUsers() {
        if (userRepository.count() != 0) {
            return;
        }

        Company company = new Company();
        company.setName("IBM");
        company = companyRepository.save(company);

        Department itHardwareDept = new Department();
        itHardwareDept.setCompany(company);
        itHardwareDept.setName("IT Hardware");
        itHardwareDept = departmentRepository.save(itHardwareDept);

        Department itSoftwareDept = new Department();
        itSoftwareDept.setCompany(company);
        itSoftwareDept.setName("IT Software");
        itSoftwareDept = departmentRepository.save(itSoftwareDept);

        Department hrDepartment = new Department();
        hrDepartment.setCompany(company);
        hrDepartment.setName("HR");
        hrDepartment = departmentRepository.save(hrDepartment);

        // Employee
        userRepository.save(createUser(company, null,           "Alex Rivera",  "employee@ibm.com",       UserRole.EMPLOYEE));
        // Agents
        userRepository.save(createUser(company, hrDepartment,   "Jordan Lee",   "hr.agent@ibm.com",       UserRole.AGENT));
        userRepository.save(createUser(company, itSoftwareDept, "Morgan Chen",  "software.agent@ibm.com", UserRole.AGENT));
        userRepository.save(createUser(company, itHardwareDept, "Casey Park",   "hardware.agent@ibm.com", UserRole.AGENT));
        // Manager
        userRepository.save(createUser(company, hrDepartment,   "Sam Torres",   "hr.manager@ibm.com",     UserRole.DEPT_MANAGER));
        // Admin
        userRepository.save(createUser(company, null,           "System Admin", "admin@ibm.com",          UserRole.SYS_ADMIN));

        System.out.println("✅ Seeded IBM, 3 departments, and 6 test users");
    }

    private User createUser(Company company, Department department, String name, String email, UserRole role) {
        User user = new User();
        user.setCompany(company);
        user.setDepartment(department);
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(role);
        return user;
    }
}
