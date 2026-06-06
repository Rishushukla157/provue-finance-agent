# Provue Finance Research Agent

A finance-research assistant built using **Mastra SDK**, **PostgreSQL**, **TypeScript**, **Express**, and **Ollama Cloud**.

The system loads financial data into PostgreSQL and uses an AI agent named **Tara** to answer finance-related questions through tool-calling. All financial answers are grounded in database queries instead of being generated directly by the model.

---

## Features

* Natural language finance Q&A
* Portfolio valuation
* Portfolio profit/loss analysis
* Mutual fund return calculation
* Fund ranking
* Merchant spend analysis
* Category spend analysis
* Monthly spending trends
* PostgreSQL-backed tool calling
* Repeatable evaluation script
* Observability through logs, traces, and screenshots

---

## Tech Stack

| Layer           | Technology        |
| --------------- | ----------------- |
| Language        | TypeScript        |
| Agent Framework | Mastra SDK        |
| API Server      | Express           |
| Database        | PostgreSQL 18     |
| LLM Provider    | Ollama Cloud      |
| Model           | gpt-oss:20b-cloud |
| Query Layer     | Raw SQL + pg      |
| Runtime         | Node.js           |

---

## High-Level Architecture

```mermaid
flowchart TD
    A[User Question] --> B[POST /ask API]
    B --> C[Tara Agent - Mastra]
    C --> D{Tool Selection}

    D --> E[Transaction Tools]
    D --> F[Fund Tools]
    D --> G[Portfolio Tools]

    E --> H[(PostgreSQL)]
    F --> H
    G --> H

    H --> E
    H --> F
    H --> G

    E --> C
    F --> C
    G --> C

    C --> I[Grounded Answer]
    I --> J[User]
```

---

## Request Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant API as Express API
    participant Tara as Tara Agent
    participant Tool as Mastra Tool
    participant DB as PostgreSQL

    User->>API: POST /ask with question
    API->>Tara: Send user question
    Tara->>Tool: Select required tool
    Tool->>DB: Run SQL query
    DB-->>Tool: Return structured data
    Tool-->>Tara: Tool result
    Tara-->>API: Grounded answer
    API-->>User: JSON response
```

---

## Agent Tool Flow

```mermaid
flowchart LR
    Q[User Question] --> T[Tara Agent]

    T --> TS[transactionSummaryTool]
    T --> TM[topMerchantsTool]
    T --> MS[monthlySpendTool]
    T --> FR[fundReturnTool]
    T --> RF[rankFundsByReturnTool]
    T --> PS[portfolioSummaryTool]

    TS --> DB[(PostgreSQL)]
    TM --> DB
    MS --> DB
    FR --> DB
    RF --> DB
    PS --> DB

    DB --> T
    T --> A[Final Answer]
```

---

## Database Schema

```mermaid
erDiagram
    FUNDS {
        string id
        string name
        string category
    }

    FUND_NAV {
        string fund_id
        date nav_date
        float nav
    }

    HOLDINGS {
        string fund_id
        string fund_name
        float units
        date purchase_date
        float purchase_nav
    }

    TRANSACTIONS {
        string id
        date date
        string merchant
        string merchant_normalized
        string category
        float amount
        string currency
        string memo
    }

    FUNDS ||--o{ FUND_NAV : has
    FUNDS ||--o{ HOLDINGS : owns
```

---

## Data Ingestion Flow

```mermaid
flowchart TD
    A[DATA_DIR] --> B[transactions.json]
    A --> C[funds.json]
    A --> D[holdings.json]

    B --> E[Normalize Merchants]
    E --> F[Insert Transactions]

    C --> G[Insert Funds]
    C --> H[Expand NAV History]
    H --> I[Insert Fund NAV Rows]

    D --> J[Insert Holdings]

    F --> K[(PostgreSQL)]
    G --> K
    I --> K
    J --> K
```

---

## Folder Structure

```text
provue-finance-agent/
│
├── src/
│   ├── db/
│   │   ├── connection.ts
│   │   └── schema.sql
│   │
│   ├── scripts/
│   │   ├── setup-db.ts
│   │   ├── ingest.ts
│   │   └── merchantNormalizer.ts
│   │
│   ├── services/
│   │   ├── transaction.service.ts
│   │   ├── fund.service.ts
│   │   └── portfolio.service.ts
│   │
│   ├── tools/
│   │   ├── transaction.tool.ts
│   │   ├── fund.tool.ts
│   │   └── portfolio.tool.ts
│   │
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── tara-agent.ts
│   │   └── index.ts
│   │
│   └── server.ts
│
├── data/
│   ├── sample_a/
│   ├── sample_b/
│   └── sample_c/
│
├── eval/
│   ├── eval.ts
│   └── expected-results.json
│
├── screenshots/
│   ├── success-run.png
│   ├── failure-run.png
│   └── eval-pass.png
│
├── README.md
├── DESIGN.md
├── package.json
├── .env.example
└── AGENTS.md
```

---

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

---

### 2. PostgreSQL Setup

Local PostgreSQL database used:

```sql
CREATE DATABASE provue_tara;
```

Connection string:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/provue_tara
```

---

### 3. Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/provue_tara
OLLAMA_BASE_URL=http://localhost:11434/v1
```

Also keep a `.env.example` file without real secrets.

---

### 4. Create Database Schema

```bash
npx tsx src/scripts/setup-db.ts
```

Expected output:

```text
Database schema created
```

---

### 5. Ingest Data

Example:

```bash
DATA_DIR=./data/sample_a npx tsx src/scripts/ingest.ts
```

Expected output:

```text
Using DATA_DIR: ./data/sample_a
Inserted 1500 transactions
Inserted 8 funds with NAV history
Inserted 8 holdings
Ingestion completed successfully
```

The ingest script is generic and can load:

```bash
DATA_DIR=./data/sample_b npx tsx src/scripts/ingest.ts
DATA_DIR=./data/sample_c npx tsx src/scripts/ingest.ts
```

---

## Ollama Cloud Setup

The project uses **Ollama Cloud** with:

```text
gpt-oss:20b-cloud
```

Verify Ollama:

```bash
ollama --version
```

Run the cloud model:

```bash
ollama run gpt-oss:20b-cloud
```

Check local Ollama API:

```bash
curl http://localhost:11434/api/tags
```

---

## Running the Server

Start the Express API:

```bash
npx tsx src/server.ts
```

Expected output:

```text
TARA SERVER LOADED
Server running on http://localhost:3000
```

---

## API Endpoints

### Health Check

```http
GET /health
```

Example:

```bash
curl http://127.0.0.1:3000/health
```

Response:

```json
{
  "status": "ok",
  "service": "provue-finance-agent"
}
```

---

### Ask Tara

```http
POST /ask
```

Example:

```bash
curl -X POST http://127.0.0.1:3000/ask \
-H "Content-Type: application/json" \
-d '{"question":"What is my portfolio worth today?"}'
```

Example response:

```json
{
  "answer": "Your portfolio’s total value today is ₹119,983.80."
}
```

---

## Example Questions

```text
What is my portfolio worth today?
```

```text
Which fund performed best between 2024-01-01 and 2025-01-01?
```

```text
How much did I spend on Swiggy?
```

```text
Who are my top 5 merchants from 2024-01-01 to 2025-03-31?
```

```text
Show monthly food spending from 2024-01-01 to 2025-03-31.
```

---

## Evaluation

Run:

```bash
npx tsx eval/eval.ts
```

Example output:

```text
=== Provue Finance Agent Evaluation ===

PASS | Portfolio Value
PASS | Best Fund
PASS | Swiggy Spend
PASS | Top Merchants
PASS | Monthly Food Spend

Result: 5/5 tests passed
```

---

## Observability

The project includes:

* Console request logs
* Agent execution logs
* Mastra Studio traces
* Evaluation output
* Screenshots of successful and handled failure/no-data runs

Example logs include:

```text
Question: What is my portfolio worth today?
```

```text
Answer: Your portfolio’s total value today is ₹119,983.80.
```

---
## Observability Evidence

### Evaluation Suite (5/5 Passed)

![Evaluation Results](./provue-finance-agent/screenshots/eval-pass.png)

The evaluation suite validates:

- Portfolio valuation
- Best performing fund
- Swiggy spend
- Top merchants
- Monthly food spending

---

### Successful Query

![Successful Query](./provue-finance-agent/screenshots/successful-query.png)


Example portfolio valuation request through `POST /ask`.

---

### No-Data Handling

![No Data Handling](./provue-finance-agent/screenshots/no-data-query.png)

The system gracefully handles requests outside the available dataset and avoids hallucinating financial information.

---

### API Logs

![Server Logs](./provue-finance-agent/screenshots/server-logs.png)
Request and response logs provide observability for debugging and traceability.

----

## Deployment

Public base URL:

```text
https://provue-finance-agent-cwcm.onrender.com
```

Hosted on:

- Render Web Service
- Render PostgreSQL

Deployed endpoints:

```text
GET /health
POST /ask
```

Health check:

```bash
curl https://provue-finance-agent-cwcm.onrender.com/health
```

Ask endpoint:

```bash
curl -X POST https://provue-finance-agent-cwcm.onrender.com/ask \
-H "Content-Type: application/json" \
-d '{"question":"What is my portfolio worth today?"}'
```

Known deployment limitations:

- Render free tier may have cold-start latency.
- Render PostgreSQL free tier has storage and connection limits.
- The deployed API uses the PostgreSQL-backed service fallback when hosted LLM tool-calling is unavailable, so answers remain grounded in database queries.


---

## Notes

* All calculations are performed through PostgreSQL-backed tools.
* The LLM does not generate financial numbers directly.
* Refunds are stored as negative amounts and reduce net spend.
* Transfers are excluded from spend unless explicitly requested.
* Merchant names are normalized during ingestion for better matching.

---

## Future Improvements

* Conversational memory
* User authentication
* Long-running async tools
* Recurring transaction detection
* More robust merchant clustering
* Real-time NAV ingestion
* Portfolio allocation insights
* Scheduled financial reports


---

---

<p align="center">
<i>Built and maintained by Rishu Shukla</i>
</p>

---

---
