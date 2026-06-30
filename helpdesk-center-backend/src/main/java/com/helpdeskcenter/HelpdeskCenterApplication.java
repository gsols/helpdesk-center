package com.helpdeskcenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@org.springframework.data.jpa.repository.config.EnableJpaAuditing
public class HelpdeskCenterApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelpdeskCenterApplication.class, args);
    }
}
