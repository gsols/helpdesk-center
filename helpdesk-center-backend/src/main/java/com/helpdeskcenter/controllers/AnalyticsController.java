package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.AiAccuracyResponse;
import com.helpdeskcenter.dto.FrtResponse;
import com.helpdeskcenter.dto.MttrEntry;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.security.AuthenticatedUser;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
