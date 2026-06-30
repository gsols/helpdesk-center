package com.helpdeskcenter.config;

import com.helpdeskcenter.entities.User;
import com.helpdeskcenter.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @EventListener(ApplicationReadyEvent.class)
    public void seedUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .username("john.doe")
                    .password(passwordEncoder.encode("password123"))
                    .email("john.doe@company.com")
                    .role("employee")
                    .fullName("John Doe")
                    .build());

            userRepository.save(User.builder()
                    .username("it.hardware")
                    .password(passwordEncoder.encode("password123"))
                    .email("it.hardware@company.com")
                    .role("it_hardware")
                    .fullName("IT Hardware Agent")
                    .build());

            userRepository.save(User.builder()
                    .username("it.software")
                    .password(passwordEncoder.encode("password123"))
                    .email("it.software@company.com")
                    .role("it_software")
                    .fullName("IT Software Agent")
                    .build());

            userRepository.save(User.builder()
                    .username("hr.agent")
                    .password(passwordEncoder.encode("password123"))
                    .email("hr.agent@company.com")
                    .role("hr")
                    .fullName("HR Agent")
                    .build());

            System.out.println("✅ Seeded 4 test users");
        }
    }
}
