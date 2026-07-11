package com.helpdeskcenter.controllers;

import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    /**
     * GET /api/departments — returns all departments belonging to the caller's company,
     * sorted alphabetically. Used by the Re-Route modal to populate the department picker.
     */
    @GetMapping
    public ResponseEntity<List<Department>> getDepartments(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(
            departmentRepository.findByCompanyIdOrderByNameAsc(principal.companyId())
        );
    }
}
