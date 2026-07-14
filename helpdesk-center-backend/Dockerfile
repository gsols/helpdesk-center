# ── Stage 1: Build ───────────────────────────────────────────────────────────
# Uses the official Maven + JDK 21 image to compile and package the JAR.
# The entire Maven dependency cache lives only in this layer — it is discarded
# after the build, keeping the final runtime image small.
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copy dependency descriptors first so Docker can cache the dep-download layer.
COPY helpdesk-center-backend/pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build the fat JAR, skipping tests (run tests in CI instead).
COPY helpdesk-center-backend/src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
# Slim JRE-only image — no compiler, no Maven, ~100 MB smaller.
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy only the fat JAR from the build stage.
COPY --from=build /app/target/helpdesk-center-backend-0.0.1-SNAPSHOT.jar app.jar

# Render injects PORT; default to 8080 for local docker run.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
