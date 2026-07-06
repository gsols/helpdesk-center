package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.enums.Priority;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlaRuleRepository extends JpaRepository<SlaRule, Long> {

    Optional<SlaRule> findByDepartmentIdAndPriority(Long departmentId, Priority priority);

    List<SlaRule> findByDepartmentCompanyIdOrderByDepartmentIdAscPriorityAsc(Long companyId);
}
