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
     * Returns the count of active (OPEN or IN_PROGRESS) tickets assigned to a specific agent.
     */
    @Query("""
        select count(t) from Ticket t
        where t.assignee.id = :agentId
          and t.status in (
              com.helpdeskcenter.enums.TicketStatus.OPEN,
              com.helpdeskcenter.enums.TicketStatus.IN_PROGRESS
          )
        """)
    int countActiveTicketsByAgent(@Param("agentId") Long agentId);

    interface DepartmentMttrView {

        Long getDepartmentId();

        String getDepartmentName();

        BigDecimal getMeanTimeToResolutionHours();
    }
}
