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
        company.setName("Default Company");
        company = companyRepository.save(company);

        Department itDepartment = new Department();
        itDepartment.setCompany(company);
        itDepartment.setName("IT");
        itDepartment = departmentRepository.save(itDepartment);

        Department hrDepartment = new Department();
        hrDepartment.setCompany(company);
        hrDepartment.setName("HR");
        hrDepartment = departmentRepository.save(hrDepartment);

        userRepository.save(createUser(company, null, "John Doe", "john.doe@company.com", UserRole.EMPLOYEE));
        userRepository.save(createUser(company, itDepartment, "IT Hardware Agent", "it.hardware@company.com", UserRole.AGENT));
        userRepository.save(createUser(company, itDepartment, "IT Software Agent", "it.software@company.com", UserRole.AGENT));
        userRepository.save(createUser(company, hrDepartment, "HR Agent", "hr.agent@company.com", UserRole.AGENT));

        System.out.println("✅ Seeded default company, departments, and 4 test users");
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
