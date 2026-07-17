package com.helpdeskcenter.config;

import com.helpdeskcenter.security.WebSocketHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.beans.factory.annotation.Value;

/**
 * STOMP-over-WebSocket configuration.
 *
 * Connect endpoint : /ws   (SockJS fallback: /ws/info, /ws/<transport>)
 * Subscribe topics : /topic/tickets/{ticketId}/comments  — live comment broadcast
 *                    /user/queue/notifications            — per-user notifications
 * Send prefix      : /app  (e.g. /app/ticket/{id}/typing)
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketHandshakeInterceptor handshakeInterceptor;

    @Value("${cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Simple in-memory broker for /topic (broadcast) and /user (point-to-point)
        registry.enableSimpleBroker("/topic", "/user");
        // Prefix for messages that are handled by @MessageMapping controllers
        registry.setApplicationDestinationPrefixes("/app");
        // Required for /user/queue/... delivery
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigin, "http://localhost:*")
                .addInterceptors(handshakeInterceptor)
                .withSockJS();
    }
}
