<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark-mode.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light-mode.png">
  <img alt="MCPA Construction and Supply" src="docs/assets/logo-light-mode.png" width="420">
</picture>

<br/>
<br/>

# BuildSync

### A Web-Based Construction Tracking and Client Management System

Built for MCPA Construction and Supply, a design-and-build firm in Bulacan, Philippines.

<br/>

[![Website](https://img.shields.io/badge/Visit%20the%20website-mcpaconstruction.com-F59E0B?style=for-the-badge&logo=googlechrome&logoColor=121212&labelColor=121212)](https://www.mcpaconstruction.com)
[![IT303](https://img.shields.io/badge/IT303-Systems%20Analysis%20%26%20Design-121620?style=for-the-badge&labelColor=5B6770)](#academic-context)
[![Status](https://img.shields.io/badge/IT303-Passed-10B981?style=for-the-badge&labelColor=121212)](#academic-context)
[![Next](https://img.shields.io/badge/Next-Capstone-0284C7?style=for-the-badge&labelColor=121212)](#academic-context)

</div>

---

## Overview

Building a house in the Philippines usually means a lot of back-and-forth: messages scattered across chat apps, plans sent as photos, cost estimates in spreadsheets, and a site that clients only see when they drive out to it.

BuildSync puts that whole journey in one place. A client sends an inquiry and pins their lot on a map, books a consultation, reviews the quotation, and then follows the build through site photos, milestones, weather delays, and permit status. The MCPA team runs the other side of it from an admin dashboard: reviewing inquiries, issuing quotations, logging site progress, and publishing finished projects to the public showcase.

**Live site:** [www.mcpaconstruction.com](https://www.mcpaconstruction.com)

---

## Features

### For clients

| | |
| :--- | :--- |
| **Inquiry and lot pinning** | Describe the project, budget, and requirements, then drop a pin on the lot using an interactive map with Philippine province, city, and barangay lookup. |
| **Consultations** | Book a face-to-face meeting or an in-browser video consultation. No third-party meeting link needed. |
| **Quotations and contracts** | Receive itemized quotations and contract documents as downloadable PDFs. |
| **Build progress** | Follow each construction stage with photo logs, milestone updates, weather delays, and LGU permit status. |
| **Account security** | Email verification, Google and Facebook sign-in, and optional face verification for sensitive actions. |
| **Bilingual interface** | Switch the whole site between English and Filipino. |
| **Project assistant** | A chatbot that answers common questions about services, process, and permits, with chat history that follows you across devices. |
| **Project recap** | A story-style summary of a finished build that can be exported as shareable slides. |

### For the MCPA team

| | |
| :--- | :--- |
| **Inquiry pipeline** | Review, filter, and move inquiries through each stage from first contact to contract. |
| **Costing and documents** | Prepare quotations, inquiry summaries, receipts, and legal documents, generated as PDFs. |
| **Receipt scanning** | Upload a payment receipt and have the key details read automatically with OCR. |
| **Site tracking** | Log progress photos, milestones, and delay events per project. |
| **Showcase management** | Publish completed projects to the public portfolio with photos, videos, and specifications. |
| **Role separation** | Clients, staff, and administrators each see only what they should. |

---

## Brand Colors

The palette comes straight from the site's stylesheet: safety amber on near-black, with slate for secondary text and two functional accents for maps and confirmations.

<div align="center">

![MCPA brand color palette](docs/assets/palette.svg)

</div>

| Role | Name | Hex |
| :--- | :--- | :--- |
| Primary | Safety Amber | `#F59E0B` |
| Emphasis | Deep Amber | `#B45309` |
| Text, light mode | Brand Black | `#121212` |
| Canvas, dark mode | Obsidian | `#080A0E` |
| Surface, dark mode | Slate Paper | `#121620` |
| Secondary text | Brand Slate | `#5B6770` |
| Maps and telemetry | Surveyor Cyan | `#0284C7` |
| Confirmed states | Verified Green | `#10B981` |

**Type:** Plus Jakarta Sans for the interface, Geist Mono for coordinates, amounts, and reference numbers.

**Icons:** SVG only. No emoji anywhere in the product.

---

## Tech Stack

### Frontend

![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%204-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)
![GSAP](https://img.shields.io/badge/GSAP-0AE448?style=for-the-badge&logo=greensock&logoColor=black)
![Lucide](https://img.shields.io/badge/Lucide%20Icons-F56565?style=for-the-badge&logo=lucide&logoColor=white)
![Lottie](https://img.shields.io/badge/Lottie-00DDB3?style=for-the-badge&logo=lottiefiles&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=for-the-badge&logo=google&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-E34F26?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Tesseract](https://img.shields.io/badge/Tesseract%20OCR-3F6FA0?style=for-the-badge&logo=google&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-E34F26?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=for-the-badge&logo=gmail&logoColor=white)

### Data

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=black)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Azure Blob Storage](https://img.shields.io/badge/Azure%20Blob%20Storage-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)

### Hosting and delivery

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Azure App Service](https://img.shields.io/badge/Azure%20App%20Service-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

### How the pieces fit

| Layer | What it does |
| :--- | :--- |
| Next.js on Vercel | Serves the public site, client portal, and admin dashboard. |
| Express on Azure | REST API, real-time events, document generation, and OCR. |
| PostgreSQL (Supabase, with Neon as standby) | Main relational data. The API fails over to Neon if the primary becomes unreachable. |
| Firestore | Chat history and live message sync. |
| Azure Blob Storage | Site photos, videos, and uploaded documents. |

---

## System Design

The Level 1 data flow diagram breaks BuildSync into six processes, each with its own data store.

| # | Process | Data store |
| :--- | :--- | :--- |
| 1.0 | User authentication and account management | User accounts |
| 2.0 | Project inquiry and site feasibility | Inquiries and site data |
| 3.0 | Consultation and meeting scheduling | Consultation schedules |
| 4.0 | Design blueprint, costing, and quotation | Blueprints and quotations |
| 5.0 | Construction tracking and LGU compliance | Construction progress |
| 6.0 | Project showcase and portfolio | Project showcase |

External entities: **Client**, **Staff**, and **Administrator**.

---

## Academic Context

BuildSync was built for **IT303: Systems Analysis and Design** and has been successfully defended and passed. It continues as our **Capstone Project**, using the analysis and design work from IT303 as its foundation.

---

## Project Team

**BSIT - 3D1**

| Member | Role |
| :--- | :--- |
| Calangi, Justin Raven | Project Manager |
| Guimayen, Edgar L. | QA and Documentation |
| Cabreros, Amos Joel | Documentation |
| [Quirante, Raymart](https://github.com/martquirante) | Full Stack Developer |

<div align="center">
<br/>

MCPA Construction and Supply · Bulacan, Philippines

</div>
