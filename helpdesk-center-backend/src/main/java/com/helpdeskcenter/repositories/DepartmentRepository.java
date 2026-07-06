package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.Department;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    List<Department> findByCompanyIdOrderByNameAsc(Long companyId);

    Optional<Department> findByNameIgnoreCaseAndCompanyId(String name, Long companyId);
}
