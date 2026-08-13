package com.helpdeskcenter.config.env;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "normalizedDatabaseUrl";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DB_URL");
        if (!StringUtils.hasText(databaseUrl)) {
            databaseUrl = environment.getProperty("spring.datasource.url");
        }

        if (!StringUtils.hasText(databaseUrl) || !databaseUrl.startsWith("postgresql://")) {
            return;
        }

        URI uri = URI.create(databaseUrl);
        Map<String, Object> properties = new HashMap<>();
        properties.put("spring.datasource.url", toJdbcUrl(uri));
        properties.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
        properties.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");

        String userInfo = uri.getRawUserInfo();
        if (StringUtils.hasText(userInfo)) {
            String[] credentials = userInfo.split(":", 2);
            if (!StringUtils.hasText(environment.getProperty("DB_USERNAME"))) {
                properties.put("spring.datasource.username", decode(credentials[0]));
            }
            if (credentials.length > 1 && !StringUtils.hasText(environment.getProperty("DB_PASSWORD"))) {
                properties.put("spring.datasource.password", decode(credentials[1]));
            }
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private String toJdbcUrl(URI uri) {
        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://");
        jdbcUrl.append(uri.getHost());
        if (uri.getPort() != -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append(uri.getRawPath());

        String query = normalizeQuery(uri.getRawQuery());
        if (StringUtils.hasText(query)) {
            jdbcUrl.append('?').append(query);
        }

        return jdbcUrl.toString();
    }

    private String normalizeQuery(String query) {
        if (!StringUtils.hasText(query)) {
            return query;
        }
        return query.replace("channel_binding=", "channelBinding=");
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
