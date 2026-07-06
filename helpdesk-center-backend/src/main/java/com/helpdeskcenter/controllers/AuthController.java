package com.helpdeskcenter.controllers;

import com.helpdeskcenter.dto.LoginResponse;
import com.helpdeskcenter.security.AuthenticatedUser;
import com.helpdeskcenter.services.AuthService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        LoginResponse response = authService.login(email, password);
        if (response == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // JWT is stateless — client discards the token
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
            "userId", principal.userId(),
            "role", principal.role(),
            "companyId", principal.companyId(),
            "departmentId", principal.departmentId()
        ));
    }
}
