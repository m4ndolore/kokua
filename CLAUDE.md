**Kōkua Hub** — a mobile-first disaster relief coordination platform for Hawaiʻi.

It connects:
- people who need help
- people who can help
- known public resources (help hubs)
- volunteer coordinators

It is **not**:
- a system of record for all relief activity
- a payment processor
- a real-time emergency service

Core principle:

> Kōkua Hub is a **hub**, not the owner of all spokes.  
> We aggregate, annotate, prioritize, and route — not replicate everything.

---

## Product Model

### Three Layers

1. **Public Layer (no auth)**
   - Find help
   - View curated resources (help hubs)
   - View summarized needs
   - Submit requests / offers / tips

2. **Coordination Layer (protected)**
   - Review incoming data
   - Curate public resources
   - Match requests to help or hubs
   - Maintain data quality

3. **Source Layer (internal)**
   - External data sources (news, orgs, social)
   - Source signals (raw observations)
   - Review-first ingestion pipeline

---

## Core Rules (Do Not Violate)

### 1. Review-first publishing
- Nothing becomes public without review unless high-confidence + trusted source
- Social and low-confidence data must always go through review

### 2. Minimal data collection
- Do not add fields unless operationally necessary
- Never require sensitive personal data

### 3. Public vs Private separation
- Public: curated, safe, minimal
- Private: raw submissions, contact info, internal notes

### 4. Outbound-first for external systems
- Always link to source when appropriate
- Do not duplicate or try to replace upstream systems

### 5. No over-engineering
- Prefer manual coordination over automation
- Prefer simple workflows over complex systems

---

## Commands

```bash
npm run dev       # Dev server on port 3000
npm run build     # Production build
npm start         # Production server
npm run lint      # ESLint