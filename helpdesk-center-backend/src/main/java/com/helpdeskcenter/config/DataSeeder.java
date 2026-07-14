package com.helpdeskcenter.config;

import com.helpdeskcenter.entities.Company;
import com.helpdeskcenter.entities.Department;
import com.helpdeskcenter.entities.SlaRule;
import com.helpdeskcenter.entities.Ticket;
import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.enums.Priority;
import com.helpdeskcenter.enums.TicketStatus;
import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.repositories.CompanyRepository;
import com.helpdeskcenter.repositories.DepartmentRepository;
import com.helpdeskcenter.repositories.SlaRuleRepository;
import com.helpdeskcenter.repositories.TicketRepository;
import com.helpdeskcenter.repositories.UserRepository;
import com.helpdeskcenter.services.SlaBackfillService;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SlaRuleRepository slaRuleRepository;
    private final TicketRepository ticketRepository;
    private final SlaBackfillService slaBackfillService;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void seedUsers() {
        boolean alreadySeeded = userRepository.count() != 0;

        if (alreadySeeded) {
            // Database already has users — only backfill the SLA debug tickets if missing.
            seedDebugTicketsIfMissing();
            return;
        }

        Company company = new Company();
        company.setName("IBM");
        company = companyRepository.save(company);

        Department itHardwareDept = new Department();
        itHardwareDept.setCompany(company);
        itHardwareDept.setName("IT Hardware");
        itHardwareDept = departmentRepository.save(itHardwareDept);

        Department itSoftwareDept = new Department();
        itSoftwareDept.setCompany(company);
        itSoftwareDept.setName("IT Software");
        itSoftwareDept = departmentRepository.save(itSoftwareDept);

        Department hrDepartment = new Department();
        hrDepartment.setCompany(company);
        hrDepartment.setName("HR");
        hrDepartment = departmentRepository.save(hrDepartment);

        // Employee
        userRepository.save(createUser(company, null,           "Alex Rivera",   "employee@ibm.com",              UserRole.EMPLOYEE));

        // HR Agents (3)
        userRepository.save(createUser(company, hrDepartment,   "Jordan Lee",    "hr.agent.alpha@ibm.com",        UserRole.AGENT));
        userRepository.save(createUser(company, hrDepartment,   "Dana Kim",      "hr.agent.beta@ibm.com",         UserRole.AGENT));
        userRepository.save(createUser(company, hrDepartment,   "Marcus Reid",   "hr.agent.gamma@ibm.com",        UserRole.AGENT));

        // IT Software Agents (3)
        userRepository.save(createUser(company, itSoftwareDept, "Morgan Chen",   "software.agent.alpha@ibm.com",  UserRole.AGENT));
        userRepository.save(createUser(company, itSoftwareDept, "Riley Nguyen",  "software.agent.beta@ibm.com",   UserRole.AGENT));
        userRepository.save(createUser(company, itSoftwareDept, "Priya Patel",   "software.agent.gamma@ibm.com",  UserRole.AGENT));

        // IT Hardware Agents (3)
        userRepository.save(createUser(company, itHardwareDept, "Casey Park",    "hardware.agent.alpha@ibm.com",  UserRole.AGENT));
        userRepository.save(createUser(company, itHardwareDept, "Avery Brooks",  "hardware.agent.beta@ibm.com",   UserRole.AGENT));
        userRepository.save(createUser(company, itHardwareDept, "Devon Reyes",   "hardware.agent.gamma@ibm.com",  UserRole.AGENT));

        // Department Managers
        userRepository.save(createUser(company, hrDepartment,   "Sam Torres",    "hr.manager@ibm.com",            UserRole.DEPT_MANAGER));
        userRepository.save(createUser(company, itSoftwareDept, "Taylor Owens",  "software.manager@ibm.com",      UserRole.DEPT_MANAGER));
        userRepository.save(createUser(company, itHardwareDept, "Jamie Flores",  "hardware.manager@ibm.com",      UserRole.DEPT_MANAGER));

        // Admin
        userRepository.save(createUser(company, null,           "System Admin",  "admin@ibm.com",                 UserRole.SYS_ADMIN));

        // Default SLA rules for every department; backfill due_at on any pre-existing tickets
        List<SlaRule> seededRules = new ArrayList<>();
        for (Department dept : List.of(itHardwareDept, itSoftwareDept, hrDepartment)) {
            seededRules.addAll(seedSlaRules(dept));
        }
        slaBackfillService.backfillAll(seededRules);

        // Resolve the first agent in each department for ticket assignment
        final Long itSoftwareDeptId = itSoftwareDept.getId();
        final Long itHardwareDeptId = itHardwareDept.getId();
        final Long hrDepartmentId   = hrDepartment.getId();
        User itSoftwareAgent = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.AGENT && itSoftwareDeptId.equals(u.getDepartment() != null ? u.getDepartment().getId() : null))
            .findFirst().orElse(null);
        User itHardwareAgent = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.AGENT && itHardwareDeptId.equals(u.getDepartment() != null ? u.getDepartment().getId() : null))
            .findFirst().orElse(null);
        User hrAgent = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.AGENT && hrDepartmentId.equals(u.getDepartment() != null ? u.getDepartment().getId() : null))
            .findFirst().orElse(null);
        User employee = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.EMPLOYEE)
            .findFirst().orElse(null);

        // ── SLA Debug Tickets ──────────────────────────────────────────────
        // One ticket per SLA state per department so every role sees the full set:
        //   • Agents    → their assigned tickets appear in My Queue
        //   • Managers  → all dept tickets appear in Dept Queue
        //   • SysAdmin  → all tickets visible via findAll()
        //   • Employee  → creator = employee, so all 18 appear in My Submitted Tickets
        //
        // dueAt offsets are relative to seed-time so states are valid on first boot:
        //   SAFE    : dueAt = now + 18h  → remaining ≈ 75% of a ~24h window → steady blue
        //   WARNING : dueAt = now +  9h  → remaining ≈ 37.5%                 → steady amber
        //   ALERT   : dueAt = now +  4h  → remaining ≈ 16.7%                 → pulsing red
        //   PAUSED  : dueAt = now + 12h, status = PENDING_EMPLOYEE            → frozen muted
        //   BREACHED: dueAt = now -  2h, status = IN_PROGRESS                 → drained to 0%
        //   NO SLA  : dueAt = null                                             → grey NO SLA SET
        ZonedDateTime now = ZonedDateTime.now();

        for (Object[] row : new Object[][] {
            { itSoftwareDept, itSoftwareAgent },
            { itHardwareDept, itHardwareAgent },
            { hrDepartment,   hrAgent         },
        }) {
            Department dept  = (Department) row[0];
            User       agent = (User)       row[1];

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] SAFE — ~18h remaining, SLA bar should be steady blue (>50%)",
                Priority.MEDIUM, TicketStatus.IN_PROGRESS, now.plusHours(18));

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] WARNING — ~9h remaining, SLA bar should be steady amber (25–50%)",
                Priority.HIGH, TicketStatus.IN_PROGRESS, now.plusHours(9));

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] ALERT — ~4h remaining, SLA bar and label should pulse red (<25%)",
                Priority.HIGH, TicketStatus.OPEN, now.plusHours(4));

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] PAUSED — 12h frozen, status=PENDING_EMPLOYEE, bar muted + italic caption",
                Priority.MEDIUM, TicketStatus.PENDING_EMPLOYEE, now.plusHours(12));

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] BREACHED — due_at 2h ago, bar drained to 0%, header = ⚠️ SLA BREACHED",
                Priority.CRITICAL, TicketStatus.IN_PROGRESS, now.minusHours(2));

            seedDebugTicket(company, dept, employee, agent,
                "[DEBUG] NO SLA — due_at is null, bar renders neutral grey with NO SLA SET label",
                Priority.LOW, TicketStatus.OPEN, null);
        }

        System.out.println("✅ Seeded IBM, 3 departments, 14 test users, default SLA rules, and 18 SLA debug tickets (6 states × 3 departments)");
    }

    /**
     * Inserts the 18 SLA debug tickets on an already-populated database.
     * Safe to call on every startup — skips silently if they already exist
     * (detected by presence of any ticket whose title starts with "[DEBUG]").
     */
    private void seedDebugTicketsIfMissing() {
        boolean debugExists = ticketRepository.findAll().stream()
            .anyMatch(t -> t.getTitle() != null && t.getTitle().startsWith("[DEBUG]"));
        if (debugExists) {
            return;
        }

        // Resolve the first agent/employee in each department from existing users
        List<User> allUsers = userRepository.findAll();

        User employee = allUsers.stream()
            .filter(u -> u.getRole() == UserRole.EMPLOYEE)
            .findFirst().orElse(null);

        if (employee == null) {
            System.out.println("⚠️  SLA debug ticket backfill skipped — no EMPLOYEE user found");
            return;
        }

        List<Department> departments = departmentRepository.findAll();
        ZonedDateTime now = ZonedDateTime.now();

        for (Department dept : departments) {
            final Long deptId = dept.getId();
            User agent = allUsers.stream()
                .filter(u -> u.getRole() == UserRole.AGENT
                    && u.getDepartment() != null
                    && deptId.equals(u.getDepartment().getId()))
                .findFirst().orElse(null);

            if (agent == null) continue;

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] SAFE — ~18h remaining, SLA bar should be steady blue (>50%)",
                Priority.MEDIUM, TicketStatus.IN_PROGRESS, now.plusHours(18));

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] WARNING — ~9h remaining, SLA bar should be steady amber (25–50%)",
                Priority.HIGH, TicketStatus.IN_PROGRESS, now.plusHours(9));

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] ALERT — ~4h remaining, SLA bar and label should pulse red (<25%)",
                Priority.HIGH, TicketStatus.OPEN, now.plusHours(4));

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] PAUSED — 12h frozen, status=PENDING_EMPLOYEE, bar muted + italic caption",
                Priority.MEDIUM, TicketStatus.PENDING_EMPLOYEE, now.plusHours(12));

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] BREACHED — due_at 2h ago, bar drained to 0%, header = ⚠️ SLA BREACHED",
                Priority.CRITICAL, TicketStatus.IN_PROGRESS, now.minusHours(2));

            seedDebugTicket(dept.getCompany(), dept, employee, agent,
                "[DEBUG] NO SLA — due_at is null, bar renders neutral grey with NO SLA SET label",
                Priority.LOW, TicketStatus.OPEN, null);
        }

        System.out.println("✅ Backfilled 18 SLA debug tickets into existing database (6 states × 3 departments)");
    }

    private List<SlaRule> seedSlaRules(Department dept) {
        int[] defaultHours = { 48, 24, 4, 1 };
        Priority[] priorities = { Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL };
        List<SlaRule> saved = new ArrayList<>();
        for (int i = 0; i < priorities.length; i++) {
            SlaRule rule = new SlaRule();
            rule.setDepartment(dept);
            rule.setPriority(priorities[i]);
            rule.setTargetResolutionHours(defaultHours[i]);
            saved.add(slaRuleRepository.save(rule));
        }
        return saved;
    }

    private void seedDebugTicket(Company company, Department department, User creator, User assignee,
                                 String title, Priority priority, TicketStatus status, ZonedDateTime dueAt) {
        Ticket t = new Ticket();
        t.setCompany(company);
        t.setDepartment(department);
        t.setCreator(creator != null ? creator : assignee);
        t.setAssignee(assignee);
        t.setTitle(title);
        t.setDescription("Seeded by DataSeeder for SLA UI state debugging. Do not resolve.");
        t.setPriority(priority);
        t.setStatus(status);
        t.setDueAt(dueAt);
        ticketRepository.save(t);
    }

    private User createUser(Company company, Department department, String name, String email, UserRole role) {
        User user = new User();
        user.setCompany(company);
        user.setDepartment(department);
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(role);
        return user;
    }
}
