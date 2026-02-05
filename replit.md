# دربي (Darby) - نظام تقسيط وقود السيارات BNPL

## Overview
Darby is a comprehensive Buy Now, Pay Later (BNPL) system for fuel purchases, mirroring platforms like Tamara and Tabby. Its primary purpose is to offer flexible payment solutions for vehicle fueling, enhance journey planning, and optimize fuel consumption through AI-driven insights. The project aims to revolutionize how individuals manage their fuel expenses and empower businesses with integrated payment solutions.

Key capabilities include:
- **Fuel Invoice Installment Service**: Manages fuel invoices and installment plans.
- **Journey Planner ("Design Your Trip")**: Facilitates route planning and stop optimization.
- **Snafi Engine**: An AI-powered system for measuring and analyzing fuel consumption, providing smart decision support for refueling.
- **Extensive Car Catalog**: Includes 400 car models from 64 global brands, covering American, Japanese, Korean, German, Chinese, Luxury, and European manufacturers.

## User Preferences
I want to work iteratively. Please ask before making major changes. I prefer detailed explanations and clear communication. Do not make changes to folder `docs/SECURITY_REPORT.md`.

## System Architecture

### Frontend
- **Technology Stack**: React, TypeScript, Vite for build tooling.
- **UI/UX**: Tailwind CSS for utility-first styling and Shadcn UI for accessible components.
- **Data Management**: TanStack Query for server state management.
- **Routing**: Wouter for client-side navigation.
- **Internationalization**: Full support for Arabic language (RTL).
- **Design Notes**: Primary colors are orange/gold (fuel theme). Supports light and dark modes. Responsive design for mobile and large screens.

### Backend
- **Technology Stack**: Express.js with TypeScript.
- **Database**: PostgreSQL managed with Drizzle ORM.
- **API Style**: RESTful APIs.

### Core Services and Features
- **Snafi Engine (AI Decision Support)**: Provides intelligent recommendations for fuel purchases based on historical data, real-time tank measurements, and fuel prices. It includes features for tracking prediction accuracy and continuous learning.
  - **Algorithm**: Compares current fuel levels with successful refueling history, calculates a confidence score, and continually learns from prediction accuracy.
  - **API Endpoints**: Dedicated endpoints for decision support sessions, accepting recommendations, completing refills, accuracy statistics, and managing fuel prices.
- **Merchant API**: Enables business partners to integrate Darby's BNPL services.
  - **Features**: Merchant registration, checkout session management, transaction processing, webhook events for real-time updates (e.g., `checkout.approved`, `payment.captured`), and commission-based settlement.
  - **Authentication**: Bearer Token with Secret Key (Sandbox/Production keys).
- **Verification & KYC System**: Comprehensive customer verification.
  - **Identity Verification**: Integrates with "Nafath" for identity confirmation.
  - **Compliance Check**: KYC/AML screening.
  - **Credit Bureau Integration**: "SIMAH" for credit reports and eligibility evaluation.
  - **Employment Verification**: "GOSI" for employment status and priority calculation.
  - **Customer Rating**: A holistic assessment system providing a combined rating and eligibility check.
  - **Priority System**: Categorizes customers into premium, high, medium, and low priority based on employment status.
  - **Credit Scores**: Defines credit score ranges for approval (Excellent, Good, Fair, Poor, Rejected).
- **Security System**:
  - **Layers**: Rate limiting (10 requests/min/IP), Input Sanitization (removes `< > ; ' " --`), ID Validation (UUIDs, Alphanumeric), Business Validation (e.g., fuel quantity 1-200L), Server-Side Pricing, Credit Limit Checks, ORM protection (parameterized queries).
  - **Threats Addressed**: SQL Injection, XSS, Brute Force, Parameter Tampering, Price Manipulation.
- **Role-Based Access Control (RBAC)**:
  - **Roles**: 27 defined functional roles across executive, middle management, and operational departments (e.g., CEO, super_admin, customer_service, fraud_analyst, cashier).
  - **Departments**: 14 administrative departments (e.g., executive, operations, finance, risk).
  - **Permissions**: 50+ detailed permissions covering user management, merchant management, invoicing, finance, risk, compliance, fraud, collections, branches, POS, workflows, and system settings.
  - **Organizational Structure Database**: Detailed schema for departments, roles, permissions, daily tasks, department relationships, reporting chains, workflow templates, approval levels, authority delegations, and department KPIs.

### File Structure
```
client/         # Frontend application
server/         # Backend application
shared/         # Shared schemas (e.g., database schemas)
```

## External Dependencies
- **PostgreSQL**: Relational database for persistent storage.
- **Nafath**: External service for identity verification.
- **SIMAH**: External credit bureau for credit reports and scoring.
- **GOSI**: External service for employment verification.