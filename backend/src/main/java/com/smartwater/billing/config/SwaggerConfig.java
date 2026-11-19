package com.smartwater.billing.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        in = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart Water Usage and Consumer Billing System API")
                        .description("Week 1 & Week 2 - Apartment & Household Schema, Water Usage Logging & Core REST APIs. " +
                                "Infosys Springboard Internship 7.0.")
                        .version("v1.0.0")
                        .contact(new Contact().name("Smart Water Billing Team").email("support@smartwater.com"))
                        .license(new License().name("Apache 2.0")));
    }
}
