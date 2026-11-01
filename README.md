<div align="center">

# MCPA Architectural & Construction System
### BuildSync Enterprise Platform

[![Production Deployment](https://img.shields.io/badge/Production%20Website-mcpaconstruction.com-d97706?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.mcpaconstruction.com)
[![Vercel Deployment](https://img.shields.io/badge/Vercel%20Mirror-mcpa--construction.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://mcpa-construction.vercel.app)
[![Academic Certification](https://img.shields.io/badge/Academic%20Course-IT303%20Systems%20Analysis%20%26%20Design-0f172a?style=for-the-badge)](https://www.mcpaconstruction.com)
[![Course Status](https://img.shields.io/badge/Defense%20Status-Completed%20%2F%20Passed-059669?style=for-the-badge)](https://www.mcpaconstruction.com)
[![Progression Track](https://img.shields.io/badge/Next%20Phase-Capstone%20Project%20Continuity-2563eb?style=for-the-badge)](https://www.mcpaconstruction.com)

<br/>

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FIRM: MCPA CONSTRUCTION & SUPPLY (BULACAN, PHILIPPINES)                         │
│ SYSTEM: BUILDSYNC — INTEGRATED CLIENT MANAGEMENT & SITE TELEMETRY PLATFORM      │
│ SPECIFICATION: IT303 SYSTEMS ANALYSIS & DESIGN (COMPLETED & CAPSTONE-READY)     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

</div>

---

## 1. System Overview

**BuildSync** is a purpose-built, web-based architectural project management, telemetry tracking, and client collaboration portal engineered specifically for **MCPA Construction & Supply**, a premier architectural design, structural drafting, and civil engineering firm operating in Bulacan, Philippines.

Traditional Philippine residential and commercial construction workflows frequently suffer from fragmented communication channels, delayed material transparency, manual drafting approvals, and opaque physical site progress updates. BuildSync unifies the entire architectural lifecycle into an authoritative **Digital Architectural Dossier**. From initial land title inspection and GPS-bounded site feasibility assessments to real-time client consultations, Bill of Quantities (BOQ) cost calculations, LGU clearance monitoring, and milestone-by-milestone photo telemetry, the platform serves as the single source of truth for clients, site engineers, and executive management.

### Live Production Deployments

* **Primary Domain**: [https://www.mcpaconstruction.com](https://www.mcpaconstruction.com)
* **High-Availability Cloud Mirror**: [https://mcpa-construction.vercel.app](https://mcpa-construction.vercel.app)

---

## 2. Academic Milestone & Capstone Progression

This system represents the primary capstone-track software artifact submitted and defended for **IT303: Systems Analysis and Design (SAAD)**. 

* **Defense & Assessment Status**: Successfully completed, evaluated, and cleared for academic compliance.
* **System Balancing**: Built upon rigorous Systems Analysis and Design methodologies, featuring a balanced Level 0 Context Diagram and Level 1 Data Flow Diagram (DFD) decomposition across six discrete operational subsystems and normalized transactional data stores.
* **Capstone Continuity**: The underlying microservice architecture, dual-database replication strategy, and client-portal infrastructure have been structured from the ground up for turnkey continuation into the upcoming **Senior Capstone Project**, providing a verified operational baseline for future field deployment and enterprise expansion.

---

## 3. Core Functional Capabilities

```text
+---------------------------------------------------------------------------------+
|                              BUILDSYNC MODULE MATRIX                            |
+---------------------------------------------------------------------------------+
| 01. Client Dossier & Portal         | 04. Technical BOQ & Blueprint Engine      |
| 02. Lot Feasibility & GIS Surveyor  | 05. Site Telemetry & LGU Compliance Logs  |
| 03. Native Video Consultation Room  | 06. Executive Project Portfolio Showcase  |
+---------------------------------------------------------------------------------+
```

### 3.1. Client Portal & Digital Dossier
* **Interactive Client Workspace**: A consolidated dashboard where verified property owners can review project phases, active blueprints, and project milestone approvals.
* **Biometric & Credentialed Authentication**: Layered access control backed by JWT token lifecycles and Google MediaPipe computer vision face-liveness verification for identity validation.
* **Multi-Language Support**: Seamless runtime switching between International English and Filipino / Tagalog across all customer-facing inquiry forms and contracts.
* **Document Vault**: Immediate client access to downloadable project milestone receipts, inspection reports, and formal legal PDF covenants rendered on-the-fly.

### 3.2. Site Feasibility & Geographic Lot Surveying
* **Geospatial Terrain Plotting**: Integrated Leaflet GIS mapping engine permitting clients and surveyors to delineate property boundaries and geodetic coordinate points across Philippine municipalities.
* **Land Title & Zoning Ingestion**: Secure upload pipelines for transfer certificates of title (TCT), zoning certifications, and topography imagery.
* **Automated OCR Verification**: Integrated Tesseract.js optical character recognition engine extracts critical property identification numbers directly from submitted registry documents.

### 3.3. Consultation & Virtual Meeting Chambers
* **Unified Booking Schedule**: Real-time calendar synchronization for coordinating on-site visits and lead architect technical interviews.
* **Native WebRTC Consultation Suite**: In-browser real-time video conference rooms with encrypted peer connections, interactive whiteboard reviews, and screen-sharing for architectural drawing revisions without third-party meeting dependencies.

### 3.4. CAD Blueprints, BOQ & Cost Estimation Engine
* **Interactive Schematic Inspection**: High-definition architectural sheet viewer equipped with pan, zoom, layer isolation, and revision tracking.
* **Itemized Bill of Quantities (BOQ)**: Automated cost calculation calculating material takeoff requirements, labor allocation, and equipment rentals based on current Philippine construction market indexes.
* **Formal Quotation Generation**: Dynamic rendering of binding cost estimates with breakdown of preliminary site work, substructure, framing, finishes, and MEP installations.

### 3.5. Construction Site Telemetry & LGU Clearance Tracker
* **Milestone-Based Visual Progress**: 0% to 100% project lifecycle tracking populated by verified site engineer photo logs, drone orthomosaics, and inspection checklists.
* **Weather & Delay Telemetry**: Built-in weather event logging to record force majeure delays and schedule adjustments transparently.
* **LGU Regulatory Compliance**: Granular tracking of Philippine municipal permits, including Barangay Clearances, Locational Clearances, Building Permits, Fire Safety Inspection Certificates (FSIC), and Occupancy Certificates.

### 3.6. Curated Project Showcase & Catalog
* **Architectural Showcase**: Public portfolio detailing completed luxury residential estates, modern minimalist bungalows, and commercial facilities.
* **Technical Specification Overviews**: Detailed structural profiles including total floor area ($m^2$), structural framing type, lot dimensions, and design style taxonomy.

---

## 4. UI/UX Architecture & Design Philosophy

The user interface of BuildSync is governed by the **MCPA Architectural Dossier Design System**. It deliberately avoids ephemeral web trends, colorful neon drop-shadows, rounded bubbly pill buttons, and cartoon construction iconography in favor of structural editorial clarity and genuine human craftsmanship.

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│ DESIGN SYSTEM TOKENS                                                          │
├─────────────────────┬─────────────────────────────────────────────────────────┤
│ Canvas Obsidian     │ #0a0c10 (Deep structural backdrop)                     │
│ Slate Paper         │ #121620 (Technical dossier card surface)                │
│ Construction Amber  │ #f59e0b (Primary safety accent & verified highlight)   │
│ Surveyor Cyan       │ #0284c7 (Geodetic reticle & GIS telemetry)             │
│ Bone White          │ #f8fafc (High-contrast typography)                     │
│ Hairline Border     │ #222838 (Crisp 1px drafting separator)                 │
└─────────────────────┴─────────────────────────────────────────────────────────┘
```

* **Architectural Materiality**: Visual containers mimic precision drafting tables and physical executive binders with razor-thin 1px borders, subtle drafting tick marks, and zero generic blur artifacts.
* **Disciplined Typographic Hierarchy**: Structural UI elements are typeset in `Inter` / `Plus Jakarta Sans`, while geodetic coordinates, financial figures, lot dimensions, and drawing sheet identifiers are strictly typeset in `JetBrains Mono`.
* **Zero-Emoji Discipline**: Communication and status indicators are rendered strictly through standardized SVG icons, technical badges, or precise vector state indicators.

---

## 5. System Architecture & Level 1 DFD Decomposition

The platform decomposes the primary System Analysis & Design context into six core transactional processes with 100% boundary balancing:

```text
+-------------------+       +---------------------------------------------+       +-------------------+
|                   | ----> | 1.0 User Authentication & Account Subsystem | <---> | D1: User Accounts |
|                   |       +---------------------------------------------+       +-------------------+
|                   |       +---------------------------------------------+       +-------------------+
|      CLIENT       | ----> | 2.0 Project Inquiry & Site Feasibility      | <---> | D2: Inquiries     |
|     (Entity)      |       +---------------------------------------------+       +-------------------+
|                   |       +---------------------------------------------+       +-------------------+
|                   | <---> | 3.0 Consultation & Virtual Meeting Chamber  | <---> | D3: Consultation  |
|                   |       +---------------------------------------------+       +-------------------+
+-------------------+                                                                                   
                                                                                                        
+-------------------+       +---------------------------------------------+       +-------------------+
|    STAFF / LEAD   | <---> | 4.0 CAD Blueprint, BOQ & Quotation Engine   | <---> | D4: Blueprints    |
|     ARCHITECT     |       +---------------------------------------------+       +-------------------+
|     (Entity)      |       +---------------------------------------------+       +-------------------+
|                   | <---> | 5.0 Construction Tracking & LGU Compliance  | <---> | D5: Site Progress |
+-------------------+       +---------------------------------------------+       +-------------------+
                                                                                                        
+-------------------+       +---------------------------------------------+       +-------------------+
|   ADMINISTRATOR   | <---> | 6.0 Project Showcase & Catalog Management   | <---> | D6: Showcases     |
|     (Entity)      |       +---------------------------------------------+       +-------------------+
+-------------------+                                                                                   
```

### High-Availability Dual Database Topology
To ensure zero data loss during site operations in variable network conditions, the platform implements an active dual-database topology:
1. **Primary OLTP**: Cloud PostgreSQL hosted via Supabase for high-throughput relational transactions, row-level security (RLS), and identity management.
2. **Replication & Recovery Engine**: Neon Serverless PostgreSQL providing real-time data replication, branch isolation for structural migrations, and automated disaster recovery failover.
3. **Real-Time Synchronizer**: Google Firebase Firestore handling low-latency chat messaging and live client notifications alongside WebSockets.

---

## 6. Complete Technology Stack

| Domain | Technology | Implementation Scope |
| :--- | :--- | :--- |
| **Frontend Framework** | `Next.js 16 (App Router)` | Server-side rendering, client hydration, route layouts, and streaming |
| **User Interface Library** | `React 19` | Declarative UI state trees, concurrent rendering, and custom hooks |
| **Styling & Design System** | `Tailwind CSS v4` | PostCSS-driven styling, zero-runtime CSS tokens, hairline boundaries |
| **Vector Motion Engine** | `GSAP (GreenSock)` | High-precision micro-interactions, timeline choreography, and viewport transitions |
| **Iconography** | `Lucide React` & SVG | Pure vector SVG iconography across administrative and portal screens |
| **Geospatial GIS** | `Leaflet` & `OpenStreetMap` | Interactive Philippine site boundary selection and coordinate capture |
| **Micro-Animations** | `Lottie React` | Lightweight, vector-rendered loading state animations |
| **Client-Side PDF Engine** | `jsPDF` | In-browser synthesis of printable client dossiers and receipts |
| **Biometric Computer Vision** | `Google MediaPipe Vision` | Real-time face-liveness detection and biometric KYC identity verification |
| **Backend Runtime** | `Node.js` (LTS) | Asynchronous backend runtime environment |
| **Application Server** | `Express.js 5` | RESTful API endpoints, request routing, rate limiting, and middleware chains |
| **Real-Time Communication** | `Socket.io` & `WebSockets` | Bidirectional telemetry pushes, live status broadcasts, and WebRTC signalling |
| **Primary Relational DB** | `PostgreSQL (Supabase)` | Core relational transactions, foreign-key relationships, and schema integrity |
| **Serverless Failover DB** | `Neon PostgreSQL` | Branchable cloud PostgreSQL cluster utilized for automated data replication |
| **Document Data Store** | `Firebase Firestore` | Real-time chat history persistence and unread notification queues |
| **Document OCR** | `Tesseract.js` | Optical character recognition on land titles and municipal clearance permits |
| **Server-Side PDF Engine** | `PDFKit` | Dynamic compilation of legal service contracts and itemized BOQ sheets |
| **Cryptographic Security** | `bcryptjs` & `jsonwebtoken` | Salted credential hashing and stateless signed bearer token authorization |
| **Media & Binary Storage** | `Azure Blob Storage` | Scalable cloud container storage for high-resolution project photos and documents |
| **Cloud Compute Hosting** | `Microsoft Azure App Service`| Containerized production Linux backend deployed in the East Japan region |
| **Edge CDN & Web Hosting** | `Vercel Platform` | Global edge distribution, asset compression, and Next.js frontend deployment |
| **Mail Transmission** | `Nodemailer` & SMTP | Automated dispatch of 6-digit verification codes and status notifications |

---

## 7. Security, Privacy & Philippine Regulatory Standards

* **Data Privacy Act of 2012 (RA 10173)**: Full compliance with National Privacy Commission (NPC) mandates regarding client personal identifying information (PII), secure document processing, and transparent consent protocols.
* **Role-Based Access Control (RBAC)**: Complete operational isolation separating `Client`, `Staff`, and `Administrator` privileges across database queries and API endpoints.
* **Asset Integrity & Defense-in-Depth**: Direct document uploads are validated through strict MIME verification, size quotas, and encrypted Azure cloud storage buckets with presigned access tokens.
* **Auditability**: All milestone approvals, financial adjustments, and consultation bookings generate immutable database log entries with timestamped user IDs and IP footprints.

---

## 8. Academic Attribution & Project Credits

* **Course**: Systems Analysis and Design (IT303)
* **Lead Developer & System Architect**: [Raymart Quirante](https://github.com/martquirante)
* **Partner Enterprise**: MCPA Construction & Supply
* **Institutional Context**: Academic software deliverable successfully defended for IT303; approved for ongoing evolution into the Senior Capstone Project.

---

<div align="center">

```text
MCPA CONSTRUCTION & SUPPLY • BULACAN, PHILIPPINES
Built with precision engineering, structural discipline, and architectural clarity.
```

</div>
