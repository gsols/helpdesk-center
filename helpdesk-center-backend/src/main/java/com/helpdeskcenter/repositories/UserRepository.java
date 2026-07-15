package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.UserRole;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByCompanyIdOrderByNameAsc(Long companyId);

    List<User> findByCompanyIdAndDepartmentIdOrderByNameAsc(Long companyId, Long departmentId);

    /** All agents in a specific department, ordered by ID for stable round-robin. */
    List<User> findByCompanyIdAndDepartmentIdAndRoleOrderByIdAsc(Long companyId, Long departmentId, UserRole role);

    /** All users of a given role across the entire company, ordered by name. Used by SYS_ADMIN. */
    List<User> findByCompanyIdAndRoleOrderByNameAsc(Long companyId, UserRole role);

    /**
     * All company users whose department_id != the given department (includes users with no
     * department). Used by the "Add New Agent" and "Create Department" agent pickers.
     */
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId " +
           "AND (u.department IS NULL OR u.department.id <> :departmentId) " +
           "ORDER BY u.name ASC")
    List<User> findEligibleForDepartment(@Param("companyId") Long companyId,
                                         @Param("departmentId") Long departmentId);

    /**
     * All company users whose id is not the given excludedId, ordered by name.
     * Used by the manager picker to exclude the currently assigned manager.
     */
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.id <> :excludedId ORDER BY u.name ASC")
    List<User> findByCompanyIdExcludingUser(@Param("companyId") Long companyId,
                                             @Param("excludedId") Long excludedId);
}
