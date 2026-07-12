package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.Ticket;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    /** Triage queue: tickets with no department assigned (ADR-0002) */
    List<Ticket> findByCompanyIdAndDepartmentIsNullOrderByCreatedAtDesc(Long companyId);

    /**
     * All unassigned tickets that have a department (i.e. classifiable, not in triage).
     * Used by the round-robin backfill on every new ticket submission.
     */
    @Query("""
        select t from Ticket t
        where t.company.id = :companyId
          and t.assignee is null
          and t.department is not null
        order by t.createdAt asc
        """)
    List<Ticket> findUnassignedWithDepartment(@Param("companyId") Long companyId);

    /** All child tickets of a parent */
    List<Ticket> findByParentIdOrderByCreatedAtAsc(Long parentId);

    @Query("""
        select t from Ticket t
        where t.company.id = :companyId
          and t.assignee.id = :agentId
          and t.department.id = :departmentId
        order by t.createdAt desc
        """)
    List<Ticket> findMyQueue(
        @Param("companyId") Long companyId,
        @Param("agentId") Long agentId,
        @Param("departmentId") Long departmentId
    );

    @Query("""
        select t from Ticket t
        where t.company.id = :companyId
          and t.department.id = :departmentId
          and t.assignee is null
        order by t.createdAt desc
        """)
    List<Ticket> findUnassignedPool(@Param("companyId") Long companyId, @Param("departmentId") Long departmentId);

    @Query("""
        select t from Ticket t
        where t.company.id = :companyId
          and t.department.id = :departmentId
          and t.assignee is not null
          and t.assignee.id <> :agentId
          and t.assignee.department.id = :departmentId
        order by t.createdAt desc
        """)
    List<Ticket> findTeamReadOnlyArchive(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId,
        @Param("agentId") Long agentId
    );

    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (m.created_at - t.created_at)) / 3600)
        FROM tickets t
        JOIN ticket_messages m ON t.id = m.ticket_id
        JOIN users u ON m.sender_id = u.id
        WHERE t.company_id = :companyId
          AND u.role IN ('AGENT', 'DEPT_MANAGER')
          AND m.created_at = (
              SELECT MIN(inner_m.created_at)
              FROM ticket_messages inner_m
              WHERE inner_m.ticket_id = t.id
          )
        """, nativeQuery = true)
    BigDecimal findAverageFirstResponseTimeHours(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT t.department_id AS departmentId,
               d.name AS departmentName,
               AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600) AS meanTimeToResolutionHours
        FROM tickets t
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE t.company_id = :companyId
          AND t.status IN ('RESOLVED', 'CLOSED')
        GROUP BY t.department_id, d.name
        """, nativeQuery = true)
    List<DepartmentMttrView> findMeanTimeToResolutionByDepartment(@Param("companyId") Long companyId);

    @Query(value = """
        SELECT COUNT(CASE WHEN cl.is_misclassified = FALSE THEN 1 END) * 100.0 / COUNT(*)
        FROM ai_classification_logs cl
        JOIN tickets t ON cl.ticket_id = t.id
        WHERE t.company_id = :companyId
        """, nativeQuery = true)
    BigDecimal findAiClassificationAccuracy(@Param("companyId") Long companyId);

    /**
     * Returns the count of active (OPEN, IN_PROGRESS, PENDING_EMPLOYEE) tickets assigned to a specific agent.
     */
    @Query("""
        select count(t) from Ticket t
        where t.assignee.id = :agentId
          and t.status in (
              com.helpdeskcenter.enums.TicketStatus.OPEN,
              com.helpdeskcenter.enums.TicketStatus.IN_PROGRESS,
              com.helpdeskcenter.enums.TicketStatus.PENDING_EMPLOYEE
          )
        """)
    int countActiveTicketsByAgent(@Param("agentId") Long agentId);

    /** Count of OPEN + IN_PROGRESS tickets in a department (backlog). */
    @Query("""
        select count(t) from Ticket t
        where t.company.id    = :companyId
          and t.department.id = :departmentId
          and t.status in (
              com.helpdeskcenter.enums.TicketStatus.OPEN,
              com.helpdeskcenter.enums.TicketStatus.IN_PROGRESS
          )
        """)
    long countBacklogByDepartment(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /** Count of all non-resolved tickets in a department. */
    @Query("""
        select count(t) from Ticket t
        where t.company.id    = :companyId
          and t.department.id = :departmentId
          and t.status not in (
              com.helpdeskcenter.enums.TicketStatus.RESOLVED,
              com.helpdeskcenter.enums.TicketStatus.CLOSED
          )
        """)
    long countActiveByDepartment(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /**
     * Count of active tickets in a department whose due_at is in the past (SLA breached).
     * Uses a native query because JPQL does not support CURRENT_TIMESTAMP comparisons
     * against nullable columns cleanly on all providers.
     */
    @Query(value = """
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.company_id    = :companyId
          AND t.department_id = :departmentId
          AND t.status NOT IN ('RESOLVED','CLOSED')
          AND t.due_at IS NOT NULL
          AND t.due_at < NOW()
        """, nativeQuery = true)
    long countBreachedByDepartment(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /** MTTR in hours for a single department (resolved/closed tickets only). */
    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600)
        FROM tickets t
        WHERE t.company_id    = :companyId
          AND t.department_id = :departmentId
          AND t.status IN ('RESOLVED','CLOSED')
        """, nativeQuery = true)
    java.math.BigDecimal findMttrByDepartment(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /**
     * All active (non-resolved, non-closed) tickets in a department, ordered newest first.
     * Used by the Manager Queue tab.
     */
    @Query("""
        select t from Ticket t
        left join fetch t.assignee
        where t.company.id    = :companyId
          and t.department.id = :departmentId
          and t.status not in (
              com.helpdeskcenter.enums.TicketStatus.RESOLVED,
              com.helpdeskcenter.enums.TicketStatus.CLOSED
          )
        order by t.createdAt desc
        """)
    List<Ticket> findActiveDeptQueue(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /**
     * Risk queue: active tickets that are breached (due_at < now) OR near-breach
     * (due within the next 60 minutes), ordered soonest-first.
     * Used by the Manager Risk Queue tab.
     */
    @Query(value = """
        SELECT t.*
        FROM tickets t
        WHERE t.company_id    = :companyId
          AND t.department_id = :departmentId
          AND t.status NOT IN ('RESOLVED','CLOSED')
          AND t.due_at IS NOT NULL
          AND t.due_at <= NOW() + INTERVAL '60 minutes'
        ORDER BY t.due_at ASC
        """, nativeQuery = true)
    List<Ticket> findRiskQueue(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    /**
     * Daily resolved/closed ticket counts for the last 7 days in a department.
     * Returns rows of (dayLabel, count) ordered ascending.
     */
    @Query(value = """
        SELECT TO_CHAR(t.updated_at AT TIME ZONE 'UTC', 'Dy') AS dayLabel,
               COUNT(*) AS ticketCount
        FROM tickets t
        WHERE t.company_id    = :companyId
          AND t.department_id = :departmentId
          AND t.status IN ('RESOLVED','CLOSED')
          AND t.updated_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE_TRUNC('day', t.updated_at), TO_CHAR(t.updated_at AT TIME ZONE 'UTC', 'Dy')
        ORDER BY DATE_TRUNC('day', t.updated_at) ASC
        """, nativeQuery = true)
    List<DailyCountView> findDailyResolutionCount(
        @Param("companyId") Long companyId,
        @Param("departmentId") Long departmentId
    );

    interface DailyCountView {
        String getDayLabel();
        Long getTicketCount();
    }

    interface DepartmentMttrView {

        Long getDepartmentId();

        String getDepartmentName();

        BigDecimal getMeanTimeToResolutionHours();
    }

    // ── Admin-overview queries ────────────────────────────────────────────────

    /** Count tickets by a specific status for a company. */
    @Query("select count(t) from Ticket t where t.company.id = :companyId and t.status = com.helpdeskcenter.enums.TicketStatus.OPEN")
    long countOpenByCompany(@Param("companyId") Long companyId);

    @Query("select count(t) from Ticket t where t.company.id = :companyId and t.status = com.helpdeskcenter.enums.TicketStatus.IN_PROGRESS")
    long countInProgressByCompany(@Param("companyId") Long companyId);

    @Query("select count(t) from Ticket t where t.company.id = :companyId and t.status = com.helpdeskcenter.enums.TicketStatus.RESOLVED")
    long countResolvedByCompany(@Param("companyId") Long companyId);

    @Query("select count(t) from Ticket t where t.company.id = :companyId and t.status = com.helpdeskcenter.enums.TicketStatus.CLOSED")
    long countClosedByCompany(@Param("companyId") Long companyId);

    /** Triage: no department assigned. */
    @Query("select count(t) from Ticket t where t.company.id = :companyId and t.department is null")
    long countTriageByCompany(@Param("companyId") Long companyId);

    /** SLA-breached active tickets company-wide. */
    @Query(value = """
        SELECT COUNT(*)
        FROM tickets t
        WHERE t.company_id = :companyId
          AND t.status NOT IN ('RESOLVED','CLOSED')
          AND t.due_at IS NOT NULL
          AND t.due_at < NOW()
        """, nativeQuery = true)
    long countBreachedByCompany(@Param("companyId") Long companyId);

    /**
     * SLA compliance rate: percentage of resolved/closed tickets completed before due_at.
     * Returns null when no SLA-governed tickets exist.
     */
    @Query(value = """
        SELECT COUNT(CASE WHEN t.due_at IS NULL OR t.updated_at <= t.due_at THEN 1 END) * 100.0
               / NULLIF(COUNT(*), 0)
        FROM tickets t
        WHERE t.company_id = :companyId
          AND t.status IN ('RESOLVED','CLOSED')
        """, nativeQuery = true)
    BigDecimal findSlaComplianceRate(@Param("companyId") Long companyId);

    /**
     * Per-department open/in-progress/resolved counts + MTTR.
     * Returns one row per department.
     */
    @Query(value = """
        SELECT
            d.id               AS departmentId,
            d.name             AS departmentName,
            COUNT(CASE WHEN t.status = 'OPEN'        THEN 1 END) AS openCount,
            COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) AS inProgressCount,
            COUNT(CASE WHEN t.status IN ('RESOLVED','CLOSED') THEN 1 END) AS resolvedCount,
            AVG(CASE WHEN t.status IN ('RESOLVED','CLOSED')
                     THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600
                END) AS mttrHours
        FROM departments d
        LEFT JOIN tickets t ON t.department_id = d.id AND t.company_id = :companyId
        WHERE d.company_id = :companyId
        GROUP BY d.id, d.name
        ORDER BY openCount DESC
        """, nativeQuery = true)
    List<DeptBreakdownView> findDeptBreakdown(@Param("companyId") Long companyId);

    /**
     * Per-agent active and resolved ticket counts company-wide.
     */
    @Query(value = """
        SELECT
            u.id               AS agentId,
            u.name             AS agentName,
            d.name             AS departmentName,
            COUNT(CASE WHEN t.status IN ('OPEN','IN_PROGRESS','PENDING_EMPLOYEE') THEN 1 END) AS activeCount,
            COUNT(CASE WHEN t.status IN ('RESOLVED','CLOSED') THEN 1 END) AS resolvedCount
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN tickets t ON t.assignee_id = u.id AND t.company_id = :companyId
        WHERE u.company_id = :companyId
          AND u.role = 'AGENT'
        GROUP BY u.id, u.name, d.name
        ORDER BY activeCount DESC
        """, nativeQuery = true)
    List<AgentSummaryView> findAgentSummary(@Param("companyId") Long companyId);

    /**
     * 20 most recently updated tickets company-wide (for recent activity feed).
     */
    @Query("""
        select t from Ticket t
        left join fetch t.department
        where t.company.id = :companyId
        order by t.updatedAt desc
        """)
    List<Ticket> findRecentActivity(@Param("companyId") Long companyId,
                                    org.springframework.data.domain.Pageable pageable);

    interface DeptBreakdownView {
        Long getDepartmentId();
        String getDepartmentName();
        Long getOpenCount();
        Long getInProgressCount();
        Long getResolvedCount();
        BigDecimal getMttrHours();
    }

    interface AgentSummaryView {
        Long getAgentId();
        String getAgentName();
        String getDepartmentName();
        Long getActiveCount();
        Long getResolvedCount();
    }
}
