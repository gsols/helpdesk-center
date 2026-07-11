package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.AiAccuracyResponse;
import com.helpdeskcenter.dto.DailyCountEntry;
import com.helpdeskcenter.dto.DeptSummaryResponse;
import com.helpdeskcenter.dto.FrtResponse;
import com.helpdeskcenter.dto.MttrEntry;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final TicketRepository ticketRepository;

    /** Average First Response Time in hours across all resolved tickets for the caller's company */
    @GetMapping("/frt")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<FrtResponse> getFirstResponseTime(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(new FrtResponse(
            ticketRepository.findAverageFirstResponseTimeHours(principal.companyId())
        ));
    }

    /** Mean Time to Resolution per department */
    @GetMapping("/mttr")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<List<MttrEntry>> getMttr(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        List<MttrEntry> result = ticketRepository
            .findMeanTimeToResolutionByDepartment(principal.companyId())
            .stream()
            .map(v -> new MttrEntry(
                v.getDepartmentId(),
                v.getDepartmentName(),
                v.getMeanTimeToResolutionHours()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** AI classification accuracy percentage */
    @GetMapping("/ai-accuracy")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<AiAccuracyResponse> getAiAccuracy(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        return ResponseEntity.ok(new AiAccuracyResponse(
            ticketRepository.findAiClassificationAccuracy(principal.companyId())
        ));
    }

    /**
     * GET /api/analytics/dept-summary
     * Returns a snapshot for the Manager Analytics dashboard:
     *  backlogCount, breachedCount, totalActive, mttrHours
     * Scoped to the caller's own department.
     */
    @GetMapping("/dept-summary")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<DeptSummaryResponse> getDeptSummary(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal.departmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has no department");
        }
        long companyId    = principal.companyId();
        long departmentId = principal.departmentId();

        long backlog   = ticketRepository.countBacklogByDepartment(companyId, departmentId);
        long breached  = ticketRepository.countBreachedByDepartment(companyId, departmentId);
        long total     = ticketRepository.countActiveByDepartment(companyId, departmentId);
        var  mttr      = ticketRepository.findMttrByDepartment(companyId, departmentId);

        return ResponseEntity.ok(new DeptSummaryResponse(backlog, breached, total, mttr));
    }

    /**
     * GET /api/analytics/dept-daily
     * Returns the last 7 days of resolved/closed ticket counts for the caller's department,
     * ordered oldest-to-newest. Used by the Team Directory Performance Snapshot chart.
     */
    @GetMapping("/dept-daily")
    @PreAuthorize("hasAnyRole('DEPT_MANAGER','SYS_ADMIN')")
    public ResponseEntity<List<DailyCountEntry>> getDeptDaily(
        @AuthenticationPrincipal AuthenticatedUser principal
    ) {
        if (principal.departmentId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User has no department");
        }
        List<DailyCountEntry> result = ticketRepository
            .findDailyResolutionCount(principal.companyId(), principal.departmentId())
            .stream()
            .map(v -> new DailyCountEntry(v.getDayLabel(), v.getTicketCount()))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
