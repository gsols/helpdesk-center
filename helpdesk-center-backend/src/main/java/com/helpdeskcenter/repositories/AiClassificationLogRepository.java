package com.helpdeskcenter.repositories;

import com.helpdeskcenter.entities.AiClassificationLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiClassificationLogRepository extends JpaRepository<AiClassificationLog, Long> {

    Optional<AiClassificationLog> findByTicketId(Long ticketId);
}
