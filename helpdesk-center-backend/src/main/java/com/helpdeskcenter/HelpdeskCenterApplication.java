package com.helpdeskcenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@org.springframework.data.jpa.repository.config.EnableJpaAuditing
@EnableAsync
public class HelpdeskCenterApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpdeskCenterApplication.class, args);
    }
}
