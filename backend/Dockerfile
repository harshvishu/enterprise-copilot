# syntax=docker/dockerfile:1
# Multi-stage build for the Enterprise Copilot backend.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd -r -u 1001 copilot
COPY --from=build /app/target/enterprise-copilot-1.0.0.jar app.jar
USER 1001
EXPOSE 8080
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]