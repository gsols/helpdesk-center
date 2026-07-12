package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.UserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByCompanyIdOrderByNameAsc(Long companyId);

    List<User> findByCompanyIdAndDepartmentIdOrderByNameAsc(Long companyId, Long departmentId);

    /** All agents in a specific department, ordered by ID for stable round-robin. */
    List<User> findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(Long companyId, Long departmentId, UserRole role);

    /** All users of a given role across the entire company, ordered by name. Used by SYS_ADMIN. */
    List<User> findByCompanyIdAndRoleOrderByNameAsc(Long companyId, UserRole role);
}
