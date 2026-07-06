package com.helpdeskcenter.entities;

import com.helpdeskcenter.enums.Priority;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "sla_rules", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"department_id", "priority"})
})
@Data
@NoArgsConstructor
public class SlaRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @NotNull
    @Column(name = "target_resolution_hours", nullable = false)
    private Integer targetResolutionHours;
}
