package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.SlaRuleResponse;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.enums.Priority;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.repositories.SlaRuleRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import com.helpdeskcenter.services.SlaBackfillService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/sla-rules")
@RequiredArgsConstructor
public class SlaRuleController {

    private final SlaRuleRepository slaRuleRepository;
    private final DepartmentRepository departmentRepository;
    private final SlaBackfillService slaBackfillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<List<SlaRuleResponse>> getAll(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<SlaRuleResponse> rules = slaRuleRepository
            .findByDepartmentCompanyIdOrderByDepartmentIdAscPriorityAsc(principal.companyId())
            .stream()
            .map(SlaRuleResponse::from)
            .toList();
        return ResponseEntity.ok(rules);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<SlaRuleResponse> create(
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        Long deptId = ((Number) body.get("departmentId")).longValue();
        Priority priority = Priority.valueOf((String) body.get("priority"));
        int hours = ((Number) body.get("targetResolutionHours")).intValue();

        Department dept = departmentRepository.findById(deptId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        if (!dept.getCompany().getId().equals(principal.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Department belongs to another company");
        }

        SlaRule rule = new SlaRule();
        rule.setDepartment(dept);
        rule.setPriority(priority);
        rule.setTargetResolutionHours(hours);
        SlaRule saved = slaRuleRepository.save(rule);
        slaBackfillService.backfill(saved);
        return ResponseEntity.status(201).body(SlaRuleResponse.from(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<SlaRuleResponse> update(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        SlaRule rule = slaRuleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SLA rule not found"));

        if (!rule.getDepartment().getCompany().getId().equals(principal.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        rule.setTargetResolutionHours(((Number) body.get("targetResolutionHours")).intValue());
        SlaRule saved = slaRuleRepository.save(rule);
        slaBackfillService.backfill(saved);
        return ResponseEntity.ok(SlaRuleResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<Void> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        SlaRule rule = slaRuleRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "SLA rule not found"));

        if (!rule.getDepartment().getCompany().getId().equals(principal.companyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        slaRuleRepository.delete(rule);
        return ResponseEntity.noContent().build();
    }
}
