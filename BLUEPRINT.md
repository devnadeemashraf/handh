You are helping me build a small but production-minded e-commerce platform that starts as a very small Instagram-driven storefront and is designed cleanly enough to scale into a proper multi-store parent brand called **H&H**.

## 1. Business idea

I am starting extremely small.

I currently plan to buy around **20 pieces total**, initially something like:

- 4 different Nose-Piece product types
- 5 pieces of each type
- Total initial inventory = 20 pieces

The initial products are modest-wear-related accessories such as a **nose-piece worn on top of an Abaya**.

My marketing/discovery channel will primarily be **Instagram**.

The intended customer journey is:

Instagram Reel / Story / Bio
→ product link
→ my website
→ customer browses products
→ customer opens a product
→ adds to cart
→ checkout
→ online payment
→ order confirmed
→ I receive an automatic notification
→ I manually prepare the order
→ I manually hand the parcel to a courier such as India Post / DTDC / another courier
→ I enter the tracking number into my admin system
→ customer receives the tracking number and a tracking link
→ tracking link redirects through my own application to the appropriate courier tracking page.

I explicitly do NOT want customers to have to:

- DM me to place an order
- ask me for payment details
- send payment screenshots
- receive QR codes from me
- manually coordinate payment with me
- manually coordinate the order through WhatsApp

The goal is:

**Instagram should become a discovery channel, while my website becomes the actual shopping and checkout experience.**

I am not managing delivery through an automated shipping API initially. I will manually ship the parcel using whatever courier is appropriate and then enter the tracking number manually.

## 2. Long-term vision

The eventual parent brand is **H&H**.

Today it may only sell modest-wear accessories.

Eventually it could have multiple stores/categories/sub-stores such as:

- Modest Wear
- Accessories
- Jewellery
- Other future product categories

I do NOT want separate codebases for each store.

The platform should conceptually be:

H&H
→ Store 1: Modest Wear
→ Store 2: Accessories
→ Store 3: Future store
→ etc.

The important architectural decision is that **“store” should be a data/configuration concept, not a separate application.**

For example, eventually the same platform could support:

- hh.com/modest-wear
- hh.com/accessories
- modest.hh.com
- accessories.hh.com
- potentially even separate domains later

without duplicating the commerce code.

## 3. Current scope

DO NOT overbuild the first version.

The immediate core use case is:

1. Instagram links to a product.
2. Customer can browse the full catalog.
3. Customer can open product detail pages.
4. Customer can add products to cart.
5. Customer enters shipping/contact details.
6. Customer pays online.
7. Payment is verified server-side.
8. Order is created/confirmed reliably.
9. I receive an automatic notification.
10. I manually pack and ship.
11. I enter tracking information.
12. Customer can see tracking information and click a tracking URL.
13. My app redirects that tracking URL to the courier's tracking website.

Do NOT add recommendation engines now.

Do NOT add AI recommendations now.

Do NOT add complex personalization.

Do NOT add unnecessary social features.

Do NOT add a mobile app.

Do NOT build microservices.

Do NOT build an ERP.

Do NOT add complicated CRM functionality.

Do NOT build a large-scale enterprise system unnecessarily.

The goal is a **small, clean, production-minded commerce application**.

## 4. My engineering background

I am an engineer and am comfortable with:

- TypeScript
- Node.js
- backend development
- APIs
- modern web development
- using AI heavily for implementation

I am going to give a large portion of the implementation to AI coding assistants.

Therefore, the architecture and coding standards must be extremely explicit.

I want AI to produce code that remains understandable at 2 AM on a Friday night months later.

I do NOT want AI to:

- randomly invent abstractions
- create unnecessary patterns
- create massive files
- duplicate business logic
- silently change architecture
- introduce unnecessary dependencies
- create inconsistent naming
- mix business logic into UI components
- create multiple competing ways of doing the same thing
- use magic numbers
- use unsafe `any`
- ignore error handling
- ignore concurrency
- ignore transaction boundaries
- introduce clever code that is hard to debug

The project should prioritize:

**boring, explicit, maintainable engineering over cleverness.**

## 5. Recommended stack

Preferred stack:

### Application

- Next.js
- TypeScript
- React

Use Next.js for:

- storefront
- admin interface
- application/API endpoints
- webhooks
- checkout flow

Do NOT immediately create a separate Express backend.

Keep business logic separate from HTTP handlers so that backend extraction is possible later if needed.

### Database

PostgreSQL.

### ORM

Drizzle ORM.

### Validation

Zod.

Use Zod at application boundaries:

- request payloads
- query parameters
- webhook payload validation where appropriate
- admin form payloads
- environment variables/configuration

### Background jobs

Redis + BullMQ.

Use background jobs for things such as:

- email notifications
- future WhatsApp notifications
- retryable tasks
- background processing
- asynchronous event handling

Jobs must be designed to be idempotent.

### Payment provider

Razorpay.

Use Razorpay's server-side order/payment flow.

Do NOT build my own payment system.

Do NOT trust browser redirects as the source of truth.

Use:

- server-created Razorpay Order
- payment signature verification
- server-side payment verification
- Razorpay webhook processing
- webhook idempotency

### Email

A transactional email provider such as Resend or equivalent.

Email is preferred initially because it is simple.

Eventually WhatsApp notifications can be added.

### Analytics

PostHog.

Use it for product/customer behavior analytics.

Do NOT use analytics as the financial source of truth.

The database remains authoritative for:

- orders
- payments
- revenue
- refunds
- inventory

### Error monitoring

Sentry.

### Product media

Use object storage rather than storing large media permanently on the VPS.

A suitable S3-compatible provider such as Cloudflare R2 is acceptable.

### Hosting

I intend to use a **Hostinger VPS**.

Initial deployment should be Docker-based.

Use:

- Docker
- Docker Compose
- Caddy or Nginx
- Cloudflare

The application should initially run as a modular monolith on one VPS.

### Repository

Use a clean Git repository.

Prefer a pnpm workspace/monorepo structure if it provides a useful separation without excessive complexity.

## 6. High-level architecture

Initial infrastructure:

Internet
→ Cloudflare
→ Hostinger VPS

Inside the VPS:

- reverse proxy
- Next.js application
- PostgreSQL
- Redis
- background worker

Conceptually:

Internet
→ Cloudflare
→ Caddy/Nginx
→ Next.js
→ PostgreSQL
→ Redis/BullMQ
→ Worker

External systems:

- Razorpay
- transactional email provider
- PostHog
- Sentry
- object storage
- future courier integrations if needed

Do NOT make everything dependent on the VPS filesystem.

Do NOT store the only copy of:

- database backups
- product media
- critical business data

on the VPS.

Use off-site backups.

## 7. Multi-environment requirement

I want proper environment separation from the beginning.

At minimum:

- local/development
- testing
- staging
- production

Promotion model:

development
→ test
→ staging
→ production

There should be no accidental production deployment from local code.

Production secrets must never be committed.

Environment variables must be validated at startup.

Expected concept:

`.env.example`
`.env.local`
staging environment configuration
production environment configuration

Never commit actual secrets.

The architecture should make environment-specific configuration explicit.

## 8. Repository organization

Keep the code organized around **business domains**, not around random pages/components.

Suggested conceptual structure:

apps/
web/
worker/

packages/
db/
domain/
payments/
notifications/
analytics/
config/

Potential domain areas:

- catalog
- inventory
- cart
- checkout
- orders
- payments
- fulfillment
- notifications
- analytics
- stores

The exact final directory structure can be improved during implementation, but the central principle is:

**business logic must not be tightly coupled to React or HTTP handlers.**

For example:

HTTP route
→ application service
→ domain logic
→ repository/database

rather than:

HTTP route
→ 700 lines of mixed database/payment/business logic.

## 9. Store model

The database should support multiple stores.

Conceptually:

`stores`

Fields may include:

- id
- slug
- name
- description
- logo
- currency
- active
- theme/configuration
- created_at
- updated_at

Potentially:

`store_domains`

- id
- store_id
- hostname
- is_primary
- created_at

The first store might be something like:

`modest-wear`

Later:

`accessories`

etc.

The same commerce engine should power all of them.

## 10. Product model

Separate products from variants.

Example:

Product:
“Abaya XYZ”

Variants:

- Black / S
- Black / M
- Black / L
- Navy / S
- Navy / M
- Navy / L

For the initial Nose-Piece products, there may simply be one variant per product.

Conceptual tables:

`products`

- id
- store_id
- category_id
- name
- slug
- description
- status
- created_at
- updated_at

`product_variants`

- id
- product_id
- sku
- name
- price_minor
- currency
- active
- created_at
- updated_at

`product_images`

- id
- product_id or variant_id as appropriate
- object storage key/URL
- sort_order
- alt_text

Prices must not be floating-point numbers.

Store monetary values as integer minor units.

Example:

₹599 → `59900` paise.

Never use floating-point arithmetic for money.

## 11. Historical price correctness

When an order is placed, the order item must preserve the price at purchase time.

For example:

Product current price today:
₹699

Historical order:
₹599

The historical order must remain ₹599 even if the product price later changes.

Therefore order items should store a price snapshot.

Do not dynamically read current product price when rendering old orders.

## 12. Inventory

Inventory belongs to variants/SKUs, not simply products.

Potential concepts:

- inventory_items
- inventory_locations
- inventory_reservations

Initial setup may only have one inventory location.

The system must handle concurrent checkout attempts correctly.

Example:

Only 1 unit remains.

Two customers attempt to buy it simultaneously.

Only one must successfully obtain the final inventory.

Do not naïvely do:

`stock = stock - quantity`

without atomicity/concurrency control.

Use database transactions and appropriate row locking or atomic updates.

Potential inventory states:

- available
- reserved
- sold

Reservations may have an expiry.

Example:

Customer starts checkout
→ inventory reserved
→ payment succeeds
→ inventory finalized as sold

OR:

reservation expires
→ inventory released

The implementation should avoid overselling.

## 13. Cart

Initial version does NOT need customer accounts.

Customers can use guest checkout.

Cart can be anonymous.

A cart can contain:

- product variant
- quantity
- price/reference information as appropriate

However, at checkout the backend MUST recalculate authoritative pricing.

Never trust prices sent by the browser.

The server decides:

- product availability
- current price
- quantity validity
- shipping amount if applicable
- discounts if/when discounts exist
- final payable amount

## 14. Orders

Order status and payment status must be separate.

Do NOT create a single combined state.

Example order states:

- pending_payment
- paid
- processing
- shipped
- delivered
- cancelled
- returned

Payment states:

- created
- authorized
- captured
- failed
- refunded
- partially_refunded

Fulfillment states can separately represent:

- unfulfilled
- packed
- shipped
- delivered

These concepts are related but not identical.

## 15. Payment architecture

Payment processing must be treated as a critical system.

Customer:

cart
→ checkout
→ server calculates authoritative total
→ internal order/payment attempt created
→ Razorpay Order created
→ customer pays
→ Razorpay webhook arrives
→ signature verified
→ payment verified
→ internal payment updated
→ order transitions to paid
→ inventory finalized
→ notification job queued

The browser's success/failure redirect is NOT the source of truth.

The server must be able to correctly process the situation where:

- customer closes the browser after paying
- customer never returns to my site
- webhook arrives later
- webhook arrives multiple times
- webhook arrives before browser callback
- browser callback is duplicated
- payment API response times out
- customer retries payment
- a payment attempt fails
- one order has multiple payment attempts

## 16. Webhook idempotency

Webhook processing must be idempotent.

Have a `webhook_events` table with something like:

- provider
- event_id
- event_type
- raw_payload
- received_at
- processed_at
- status
- error information if needed

`event_id` should be uniquely constrained.

If the same webhook arrives twice:

First:
process it.

Second:
recognize that it was already processed and do not duplicate side effects.

Never send two customer emails because of duplicate webhook delivery.

Never deduct inventory twice.

Never create duplicate orders.

Raw webhook bodies should be retained as needed for secure signature verification/auditing.

## 17. Payment attempts

An order may have more than one payment attempt.

Therefore distinguish:

Order
Payment Attempt
Provider Payment

Potential conceptual model:

Order:
`ORD-00123`

Payment attempts:

Attempt #1:
FAILED

Attempt #2:
SUCCESS

The final order state is based on the verified successful payment.

Do not assume one order = one payment attempt.

## 18. Database transactions

Use PostgreSQL transactions whenever multiple state changes must succeed together.

Example payment capture handling:

transaction:

- validate event
- locate payment
- transition payment state
- transition order state
- finalize inventory
- create outbox/event record

Do not perform half of a business operation in the database and half in unrelated asynchronous logic unless the architecture explicitly supports recovery.

## 19. Outbox/event pattern

Do not make notification delivery part of the critical payment transaction.

Bad concept:

payment succeeds
→ update order
→ call email API
→ hope everything works

Better:

DB transaction:

- mark payment captured
- mark order paid
- finalize required state
- create durable event/outbox record

Then:

worker
→ picks up event
→ sends email
→ retries if necessary

This means an email provider outage does not make payment processing appear to have failed.

## 20. Background job requirements

Use BullMQ/Redis for asynchronous work.

Jobs should be:

- retryable
- observable
- idempotent
- explicitly named
- safe to run more than once

Avoid jobs whose only identity is an arbitrary generated UUID if doing so would prevent deduplication.

Example:

`send-order-confirmation:ORD-00123`

The job should have a deterministic business identity where appropriate.

## 21. Notifications

Initial notification to admin:

Email.

Example:

NEW ORDER #HH-1023

Product:
Pearl Gold Nose Piece × 1

Customer:
Name

Phone:
...

Amount:
₹599

Payment:
PAID

Shipping:
...

The system should later support:

- customer order confirmation email
- shipping notification
- admin notification
- WhatsApp notification

But do not require WhatsApp initially.

## 22. Fulfillment

I am manually handling fulfillment initially.

I will:

1. Receive confirmed order.
2. Pack it.
3. Give it to India Post / DTDC / another courier.
4. Receive tracking number.
5. Enter tracking number in admin panel.
6. Select courier/provider.
7. Save shipment details.

Conceptually:

`fulfillments`

Fields might include:

- id
- order_id
- courier_provider
- tracking_number
- shipped_at
- status
- created_at
- updated_at

Do not integrate with courier APIs initially.

## 23. Customer tracking

Customer should NOT need to understand internal courier systems.

My website should provide something like:

Order shipped.

Courier: DTDC

Tracking Number:
XXXXXXXX

Track Shipment

Clicking the link should go through my own application:

`/track/{trackingReference}`

The application then redirects to the configured courier tracking URL.

Example:

my-site.com/track/abc123
→ redirect
→ DTDC tracking URL

This gives me a stable URL under my own domain and means that the actual courier URL can change without requiring me to change the customer-facing link everywhere.

Do not blindly accept arbitrary external redirect URLs from the client because that could create an open-redirect vulnerability.

Courier/provider should come from a controlled server-side allowlist/configuration.

Potential abstraction:

`TrackingProvider`

with implementations such as:

- IndiaPostTrackingProvider
- DtdcTrackingProvider
- FutureProvider

But do NOT create a huge plugin framework prematurely.

## 24. Admin panel

Initial admin should be intentionally small.

Sections:

Dashboard
Orders
Products
Inventory
Collections/Categories
Store settings
Analytics
Settings

Dashboard could show:

- orders today
- revenue today
- items sold
- pending payment
- paid orders requiring processing
- shipments awaiting tracking number

Order page should support:

- viewing order
- viewing customer
- viewing payment state
- viewing items
- marking processing
- marking shipped
- adding courier
- adding tracking number
- generating/viewing tracking link

Do not build a giant admin system yet.

## 25. Authentication/security

Admin authentication must be separate from customer guest checkout.

Protect admin routes strongly.

Do not expose admin functionality through public APIs without authorization.

Apply authorization at the server layer, not just by hiding buttons in the UI.

Use secure session handling.

Never store passwords in plaintext.

Do not log sensitive credentials.

Avoid putting payment secrets in client-side JavaScript.

Razorpay secret keys must exist only on the server.

Use environment variables/secrets management.

## 26. Input validation

Every external input is untrusted.

Validate:

- request bodies
- query parameters
- route parameters
- IDs
- quantities
- prices where they are provided for comparison only
- customer data
- tracking data
- admin inputs
- webhook data

Use Zod at boundaries.

After validation, use strongly typed domain objects.

## 27. Money/security rules

Absolute rules:

- Never trust client-calculated totals.
- Never use floating point for currency.
- Never mark an order paid just because the frontend says success.
- Never trust a payment ID from the client without verifying it.
- Never process a payment webhook without authenticating it.
- Never process the same webhook twice.
- Never deduct inventory twice.
- Never assume a webhook arrives exactly once.
- Never assume network requests are reliable.
- Never assume payment callback and webhook arrive in a particular order.
- Never expose payment secrets.
- Never put financial truth in analytics.

## 28. Rate limiting

Introduce basic rate limiting for sensitive endpoints such as:

- login/admin authentication
- checkout creation
- payment creation
- webhook endpoints where appropriate
- tracking endpoint
- public APIs vulnerable to abuse

Do not overengineer this initially.

Redis can eventually support distributed rate limiting.

## 29. Logging

Use structured logging.

Every important operation should have enough context to debug it.

Examples:

- request ID
- order ID
- payment attempt ID
- webhook event ID
- job ID

Do NOT log:

- payment secret keys
- passwords
- unnecessary card/payment details
- authentication tokens
- highly sensitive customer data

Prefer:

`order_id=ORD-1023 payment_attempt_id=PA-123`

instead of dumping an entire request body into logs.

## 30. Observability

At minimum:

- Sentry for application errors
- structured application logs
- PostHog for product analytics
- database monitoring/basic health checks
- worker/job monitoring

Health endpoints can eventually include:

`/health/live`

and

`/health/ready`

Keep readiness checks meaningful but not excessively complicated.

## 31. Analytics

Analytics should track the customer journey.

Initial events:

- store_view
- product_view
- add_to_cart
- remove_from_cart
- checkout_started
- payment_started
- payment_failed
- payment_succeeded
- order_created
- order_paid
- order_shipped
- order_delivered

Track properties such as:

- store_id
- product_id
- variant_id
- campaign
- source
- medium
- amount where appropriate
- currency

Do NOT send unnecessary personal information to analytics.

Financial truth must remain in PostgreSQL.

## 32. Instagram attribution

Links from Instagram should use UTM/query attribution where appropriate.

Example concept:

`?utm_source=instagram&utm_medium=social&utm_campaign=nose_piece_launch&utm_content=reel_001`

Use analytics to determine:

- which Reel generated visitors
- which Reel generated product views
- which Reel generated add-to-cart events
- which Reel generated actual purchases
- which products have strong views but weak conversion

Do not build recommendations yet.

Analytics only.

## 33. Product catalog

Initial storefront should have:

- home/store page
- list of all products
- product cards
- product detail page
- product images
- price
- availability
- product description
- add to cart
- cart
- checkout

Do not implement recommendation widgets.

Do not show “you may also like”.

Do not build a recommendation engine.

Products should simply be browsable.

## 34. SEO

Make product URLs stable and human-readable.

Examples:

`/modest-wear`
`/modest-wear/nose-piece-pearl-gold`
`/modest-wear/nose-piece-black`

Use server-rendered/SEO-friendly product pages.

Add appropriate metadata and Open Graph information so Instagram/social sharing has good previews where applicable.

## 35. Images

Product images should be optimized.

Do not serve huge original files directly to customers.

Use appropriate image transformations/CDN/object storage mechanisms.

Store metadata/reference to images in PostgreSQL.

Actual binary media should generally be in object storage.

## 36. Backups

Because this is a commerce application, backups are mandatory.

At minimum:

- automated PostgreSQL backups
- off-site backup destination
- backup retention policy
- restore procedure
- periodic restore verification

Do not assume VPS snapshots are enough.

A backup that has never been restored/tested should not be treated as proven disaster recovery.

## 37. Deployment

Dockerize the application.

Potential production services:

- app
- worker
- postgres
- redis
- reverse proxy

Use Docker Compose initially.

Do not use Kubernetes.

Do not introduce an orchestration platform until the actual scale requires it.

## 38. Hostinger VPS setup

I want a clean server setup.

Conceptually:

Internet
→ Cloudflare
→ Hostinger VPS
→ Caddy/Nginx
→ Docker services

The VPS should have:

- SSH hardening
- firewall
- Docker
- automatic security updates where appropriate
- non-root application operation
- SSH key authentication
- restricted exposed ports
- HTTPS
- centralized logs
- backups

Do not expose PostgreSQL publicly.

Do not expose Redis publicly.

Only expose necessary HTTP/HTTPS/SSH ports, with SSH restricted appropriately.

## 39. Production environment philosophy

Production should be boring.

No manual source-code editing on the production server.

Deployment should come from Git.

The desired lifecycle is:

feature branch
→ pull request
→ automated checks
→ merge
→ deploy test
→ validate
→ promote to staging
→ validate
→ promote to production

Production should run a known Git commit/image.

Do not deploy arbitrary uncommitted code.

## 40. Git strategy

Keep commit history clean and understandable.

Use small commits with one logical purpose.

Example:

`feat: add product catalog`

`feat: add guest cart`

`feat: add checkout validation`

`feat: add razorpay order creation`

`feat: add payment webhook verification`

`feat: make webhook processing idempotent`

`feat: add inventory reservation`

`feat: add order confirmation email`

`feat: add manual shipment tracking`

`test: add payment webhook failure cases`

`fix: prevent duplicate inventory deduction`

Avoid commits such as:

`stuff`

`changes`

`final final`

`AI generated things`

Do not mix unrelated refactors with feature work.

## 41. AI coding rules

This is extremely important.

Whenever you modify the code:

1. First understand the current architecture.
2. Identify the existing patterns.
3. Reuse existing abstractions when appropriate.
4. Do not create a new pattern when an existing one solves the same problem.
5. Do not refactor unrelated code while implementing a feature.
6. Keep changes focused.
7. Add tests for business-critical logic.
8. Update documentation when architecture changes.
9. Never silently change database behavior.
10. Never silently change payment behavior.
11. Never silently change public API behavior.
12. Never add a dependency without explaining why it is needed.
13. Never use `any` unless there is a documented exceptional reason.
14. Never suppress TypeScript errors merely to make the build pass.
15. Never ignore promise rejections.
16. Never catch errors without deciding what the correct recovery behavior is.
17. Never return raw internal database errors to customers.
18. Never trust frontend-calculated monetary values.
19. Never trust frontend inventory information.
20. Never assume webhook delivery is exactly once.
21. Never implement financial state transitions without tests.
22. Never modify a database schema without considering migration and rollback.
23. Never write giant functions.
24. Prefer small, named functions with explicit responsibilities.
25. Prefer explicit data flow over magic abstraction.
26. Prefer composition over unnecessary inheritance.
27. Avoid premature generic frameworks.
28. Keep public API contracts explicit.
29. Keep domain logic independent of React where practical.
30. If uncertain, inspect the existing codebase first rather than inventing a new architecture.

## 42. Coding style

Use TypeScript strict mode.

Prefer:

- `async/await`
- explicit return types on important service functions
- immutable data where practical
- discriminated unions for state machines
- typed domain errors
- exhaustive handling of important enum/state values
- Zod validation at boundaries
- small pure functions for calculations
- transactions for multi-step state transitions

Avoid:

- `any`
- deep nesting
- giant classes
- service locator patterns
- global mutable state
- unnecessary singletons
- hidden side effects
- implicit business rules
- magic numbers
- stringly typed state where a proper type can exist

## 43. Error handling

Differentiate:

- expected business errors
- validation errors
- authorization errors
- not found
- external provider failures
- infrastructure failures
- programmer bugs

Example conceptual domain errors:

`InsufficientInventoryError`

`InvalidOrderStateError`

`PaymentVerificationFailedError`

`PaymentAlreadyProcessedError`

`OrderNotFoundError`

`UnauthorizedError`

Do not expose internal exception details to customers.

Log useful diagnostics internally.

Return stable customer-safe messages.

## 44. State machines

Payment and order states are critical.

Do not allow arbitrary state transitions.

Example concept:

PENDING_PAYMENT
→ PAID
→ PROCESSING
→ SHIPPED
→ DELIVERED

Some transitions should be illegal.

For example:

DELIVERED
→ PENDING_PAYMENT

should not simply be allowed because some endpoint passed `"pending_payment"`.

Implement explicit transition rules.

Same concept applies to payment states and inventory states.

## 45. Tests

Testing should prioritize business correctness.

Unit tests:

- money calculations
- cart calculations
- inventory calculations
- state transitions
- order validation
- payment state transitions
- tracking URL generation

Integration tests:

- database operations
- inventory concurrency
- checkout flow
- payment webhook handling
- duplicate webhook handling
- order creation

End-to-end tests:

- product browsing
- cart
- guest checkout
- successful payment flow where test infrastructure allows it
- admin order management
- shipment/tracking flow

Especially test:

- duplicate webhooks
- duplicate checkout submissions
- final-stock race conditions
- failed payment
- payment success + email failure
- payment success + worker crash
- webhook arriving before redirect
- redirect arriving before webhook
- repeated retries

## 46. Testing philosophy

For money-related code:

**tests are part of the feature, not an optional extra.**

A feature touching:

- payments
- inventory
- refunds
- order status

should not be considered complete until its failure cases are tested.

## 47. Security priorities

Highest priority:

1. payment integrity
2. inventory integrity
3. admin authentication/authorization
4. secret management
5. input validation
6. webhook authenticity
7. idempotency
8. database safety
9. backup/recovery
10. rate limiting
11. secure HTTP configuration
12. logging/observability

Never optimize only for happy-path functionality.

## 48. Scalability philosophy

Start with a modular monolith.

Do NOT start with microservices.

The architecture should allow later extraction.

Possible future evolution:

Stage 1:

One VPS:

- Next.js
- worker
- PostgreSQL
- Redis

Stage 2:

Multiple application instances behind a load balancer.

Managed PostgreSQL.

Managed Redis.

Object storage/CDN.

Stage 3:

Only if actual scale requires it:

Separate services such as:

- commerce API
- payments
- inventory
- catalog
- fulfillment
- notification workers

But do NOT create these as separate services now.

The code should be organized so extraction is possible later.

## 49. Do not confuse scalability with complexity

The project should be:

- scalable in architecture
- simple in deployment
- simple in local development
- easy to debug
- easy to test
- easy to reason about

Do not introduce infrastructure simply because large companies use it.

Use PostgreSQL because relational transactions matter.

Use Redis/BullMQ because asynchronous/retryable jobs matter.

Use Docker because deployments should be reproducible.

Use Cloudflare because it provides useful edge/security functionality.

Use object storage because media shouldn't live only on the VPS.

Use Sentry/PostHog because observability and analytics matter.

Everything else must justify its existence.

## 50. Initial milestone structure

Development should be broken into independent milestones.

Each milestone should:

- have a clear objective
- have explicit scope
- have explicit non-goals
- introduce only necessary architecture
- include tests
- be reviewable independently
- result in a clean commit or small sequence of related commits
- leave the codebase in a working state

Recommended broad milestone progression:

Milestone 0:
Project foundation and engineering standards.

Milestone 1:
Database + schema + migrations.

Milestone 2:
Store/catalog/product management.

Milestone 3:
Public storefront/product pages.

Milestone 4:
Guest cart.

Milestone 5:
Checkout domain.

Milestone 6:
Razorpay integration.

Milestone 7:
Payment webhooks + idempotency.

Milestone 8:
Inventory reservation/concurrency correctness.

Milestone 9:
Order lifecycle.

Milestone 10:
Admin authentication + admin interface.

Milestone 11:
Transactional email / notification worker.

Milestone 12:
Manual fulfillment + tracking links.

Milestone 13:
Analytics + Instagram attribution.

Milestone 14:
Observability + security hardening.

Milestone 15:
Docker + VPS deployment.

Milestone 16:
Testing/staging/production promotion workflow.

Milestone 17:
Production readiness audit.

These milestones can be subdivided further, but each should remain independently reviewable.

## 51. Definition of done

A milestone is NOT done merely because the feature appears to work.

A milestone is done when:

- implementation exists
- types are correct
- validation exists
- business rules are enforced server-side
- error handling is intentional
- tests exist
- important failure cases are covered
- logging is sufficient
- security considerations are addressed
- database migration exists where needed
- documentation is updated where needed
- no unrelated cleanup has been mixed into the change
- the code builds
- lint passes
- tests pass
- deployment implications are understood

## 52. AI working process

For every milestone:

1. Explain what will be built.
2. List files expected to change/create.
3. Explain database changes.
4. Explain security concerns.
5. Explain edge cases.
6. Implement in small steps.
7. Write tests.
8. Run tests/typecheck/lint.
9. Review the implementation for failure cases.
10. Summarize what changed.
11. Give the recommended Git commit(s).
12. Stop at the milestone boundary unless explicitly asked to continue.

Do not silently jump across multiple milestones.

When a design choice has multiple valid approaches, explain the tradeoff and choose one consistent approach rather than implementing multiple competing solutions.

## 53. Resume/interview value

This project is also intentionally a serious engineering project I can discuss in future job interviews.

It should demonstrate real-world engineering skills such as:

- transactional systems
- payment integration
- webhook idempotency
- concurrency control
- inventory consistency
- state machines
- asynchronous processing
- retries
- observability
- analytics
- infrastructure
- CI/CD
- environments
- security
- production deployment
- domain-driven modular architecture

Do not artificially add complexity merely to make the resume sound impressive.

The interview story should come from solving real engineering problems correctly.

## 54. What the final first version should feel like

For the customer:

Instagram
→ click product
→ browse store
→ select product
→ add to cart
→ checkout
→ pay
→ receive order confirmation
→ later receive shipping/tracking information
→ click tracking link

For me:

Instagram generates traffic
→ customer places order
→ I receive notification
→ open admin
→ pack item
→ hand it to courier
→ enter tracking number
→ done.

There should be very little manual customer interaction.

## 55. Current priorities

Priority order:

1. Correct payments.
2. Correct inventory.
3. Correct orders.
4. Simple storefront.
5. Simple admin.
6. Notifications.
7. Manual fulfillment/tracking.
8. Analytics.
9. Deployment/reliability.
10. Future scalability.

Do not build future features before the core commerce flow works correctly.

## 56. Absolute product principle

This project should start small enough that one person can operate it.

The architecture should be strong enough that the code does not have to be rewritten when H&H grows.

The implementation should remain simple enough that another engineer—or me months later—can open the repository and understand:

- how an order is created
- how money flows
- how payments are verified
- how inventory is reserved
- how webhooks are handled
- how notifications work
- how shipments are tracked
- how deployment works

without reverse-engineering a giant framework.

Build a **boring, explicit, reliable commerce system first**.

Then scale the system only when actual business requirements justify the added complexity.
