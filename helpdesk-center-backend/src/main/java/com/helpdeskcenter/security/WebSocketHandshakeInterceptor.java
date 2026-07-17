package com.helpdeskcenter.security;

import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Validates the JWT supplied as a query parameter on the WebSocket handshake.
 *
 * The frontend passes the token as:  /ws?token=<JWT>
 *
 * On success the authenticated principal is stored in the WS session attributes
 * so Spring can resolve the user destination prefix (/user/...) correctly.
 */
@Component
@RequiredArgsConstructor
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketHandshakeInterceptor.class);

    private final JwtProvider jwtProvider;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        String query = request.getURI().getQuery();
        String token = extractToken(query);

        if (token != null && jwtProvider.isValid(token)) {
            Claims claims = jwtProvider.validateAndParseClaims(token);
            Long userId = Long.valueOf(claims.getSubject());
            String email = claims.get("email", String.class);
            String role  = claims.get("role",  String.class);
            Long companyId = ((Number) claims.get("companyId")).longValue();
            Object deptObj = claims.get("departmentId");
            Long departmentId = deptObj == null ? null : ((Number) deptObj).longValue();

            AuthenticatedUser principal = new AuthenticatedUser(
                userId, email,
                com.helpdeskcenter.enums.UserRole.valueOf(role),
                companyId, departmentId
            );
            attributes.put("principal", principal);
            attributes.put("userId", userId.toString());   // used by Spring for /user routing
            log.debug("[WS] Handshake accepted for userId={}", userId);
            return true;
        }

        log.warn("[WS] Handshake rejected — missing or invalid JWT");
        return false;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) { }

    private String extractToken(String query) {
        if (query == null) return null;
        for (String part : query.split("&")) {
            if (part.startsWith("token=")) return part.substring(6);
        }
        return null;
    }
}
