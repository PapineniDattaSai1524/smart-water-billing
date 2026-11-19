package com.smartwater.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Smart Water Usage and Consumer Billing System
 * Infosys Springboard Internship 7.0 - Week 1 & Week 2
 *
 * Scope implemented in this build:
 *  - JWT-secured authentication (register/login/refresh)
 *  - User profile management
 *  - Apartment & Household CRUD
 *  - Resident assignment
 *  - Water meter configuration
 *  - Water usage logging (manual + bulk CSV upload)
 *  - Alert & Notification Engine (Week 3-4): scheduled threshold/anomaly
 *    detection, per-apartment configuration, resident + admin notifications
 */
@SpringBootApplication
@EnableScheduling
public class BillingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(BillingSystemApplication.class, args);
    }
}
