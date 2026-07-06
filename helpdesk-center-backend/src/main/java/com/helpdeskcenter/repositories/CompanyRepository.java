package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
}
