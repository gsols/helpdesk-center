package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByCompanyIdOrderByNameAsc(Long companyId);

    List<User> findByCompanyIdAndDepartmentIdOrderByNameAsc(Long companyId, Long departmentId);
}
