package com.helpdeskcenter.security;

import com.helpdeskcenter.enums.UserRole;
import com.helpdeskcenter.entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtProvider {

    private final SecretKey key;
    private final long expirationMs;

    public JwtProvider(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        return Jwts.builder()
            .subject(user.getId().toString())
            .claim("email", user.getEmail())
            .claim("role", user.getRole().name())
            .claim("companyId", user.getCompany().getId())
            .claim("departmentId", user.getDepartment() == null ? null : user.getDepartment().getId())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact();
    }

    public Claims validateAndParseClaims(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean isValid(String token) {
        try {
            validateAndParseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return Long.valueOf(validateAndParseClaims(token).getSubject());
    }

    public UserRole getRole(String token) {
        return UserRole.valueOf(validateAndParseClaims(token).get("role", String.class));
    }

    public Long getCompanyId(String token) {
        return ((Number) validateAndParseClaims(token).get("companyId")).longValue();
    }

    public Long getDepartmentId(String token) {
        Object deptId = validateAndParseClaims(token).get("departmentId");
        return deptId == null ? null : ((Number) deptId).longValue();
    }
}
