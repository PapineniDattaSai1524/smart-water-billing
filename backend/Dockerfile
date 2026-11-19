# Multi-stage build: compile with Maven + JDK 21, run on a slim JRE 21.
# Matches <java.version>17</java.version> compiler target in pom.xml but
# runs on JRE 21 (project was verified against OpenJDK 21 locally) --
# adjust the runtime tag to eclipse-temurin:17-jre-jammy if you need to
# match exactly 17 at runtime too.

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
# Cache dependencies separately from source so `docker compose build` is fast
# on repeat builds when only .java files change.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN useradd --create-home --shell /bin/false appuser
COPY --from=build /build/target/*.jar app.jar
RUN mkdir -p /app/uploads/photos && chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
