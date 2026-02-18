# Construtodo Node Backend

Node.js (Express) backend with the **same API surface** as the FastAPI (Python) backend, using **PostgreSQL**.

## Requirements

- Node.js 18+
- PostgreSQL (same database as the Python backend; tables are shared)

## Setup

1. Copy `.env.example` to `.env` and set:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (same as Python backend)
   - `JWT_SECRET_KEY` (use the same value as Python backend if you want tokens to work across both)
   - `GOOGLE_CLIENT_ID` for Google auth
   - `PORT` (default 8001 so it doesn’t clash with Python on 8000)

2. Install and run:

```bash
npm install
npm run dev
```

Server runs at `http://127.0.0.1:8001` (or your `PORT`).

## API parity with FastAPI backend

| Area | Endpoints |
|------|-----------|
| **Health** | `GET /`, `GET /health`, `GET /database/health` |
| **Auth** | `POST /api/v1/auth/register`, `POST /api/v1/auth/email-login`, `POST /api/v1/auth/google`, `POST /api/v1/auth/token/exchange`, `GET /api/v1/auth/me`, `GET /api/v1/auth/login`, `GET /api/v1/auth/callback`, `GET /api/v1/auth/logout` (returns JSON `{ redirect_url }` like FastAPI) |
| **Users** | `GET /api/v1/users/profile`, `PUT /api/v1/users/profile` |
| **Entities** | For each of `quotes`, `reviews`, `project_requests`, `project_files`, `user_profiles`, `platform_ratings`: `GET /api/v1/entities/<name>`, `GET /api/v1/entities/<name>/all` (supports `?query=` JSON filter, e.g. `?query={"status":"pending"}`), `GET /api/v1/entities/<name>/:id`, `POST`, `PUT`, `DELETE` (single + batch). Create/update accept `body.data` for SDK compatibility. |
| **Admin** | `GET /api/v1/admin/settings`, `PUT/POST/DELETE /api/v1/admin/settings/backend/:key`, `PUT/POST/DELETE /api/v1/admin/settings/frontend/:key` |
| **Storage** | `POST /api/v1/storage/create-bucket`, `GET /api/v1/storage/list-buckets`, etc. (stubbed) |
| **AI** | `POST /api/v1/aihub/gentxt`, `POST /api/v1/aihub/genimg` (stubbed) |

Tables (`users`, `quotes`, `reviews`, etc.) are created by the **Python backend** (or migrations). This Node backend only reads/writes; it does not create schema.

## Project lifecycle (quotes & completion)

- **Accept quotes end** when the client accepts one quote: the project moves to `in_progress`, the chosen quote is stored in `selected_quote_id`, and other pending quotes are rejected. No further quotes can be accepted.
- The client can **mark the project as completed** from the project detail page when status is `in_progress`. That sets `status` to `completed` and ends the flow.

## Payments (CONSTRUCTODO requirements)

Per project requirements:

- **Client**: CONSTRUCTODO acts as **garantía** (guarantor) of delivery. The client pays a **4.5% mandatory commission on the accepted quote**. Any direct negotiation with the professional voids the guarantee. The client sees only the 4.5% message.
- **Professional**: The platform charges **10% on the payment received**. Negotiating outside the platform is strictly prohibited. The professional sees only the 10% message (the client does not see this).

**Implementation:**

- `project_requests` has `payment_status` (`pending_payment` | `paid` | `released`), `total_client_paid`, and `paid_at`.
- When the client accepts a quote, the project is set to `payment_status: 'pending_payment'`.
- **Total client pays** = quote amount × (1 + 4.5%). **Professional receives** = quote amount × 90%.
- The frontend shows the payment breakdown and garantía text; the client can confirm payment (e.g. after transfer). For full payment processing, integrate Stripe (or similar) later and set `payment_status`/`paid_at` via webhook.

## Switching frontend to Node backend

Point the frontend API base URL to the Node server (e.g. `http://127.0.0.1:8001`). Use the same `JWT_SECRET_KEY` as the Python backend if you want existing tokens to work.
