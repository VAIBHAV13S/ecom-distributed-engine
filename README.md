# ⚡ Ecom Distributed Engine (`ecom-distributed-engine`)

A production-grade, distributed microservices engine engineered for high-throughput, fault-tolerant e-commerce operations. Built with Node.js, Express, MongoDB, Docker, Nginx, and Kubernetes, Ecom Distributed Engine implements Domain-Driven Design (DDD), Database-per-Service data isolation, an intelligent Nginx API Gateway with reverse-proxy load balancing, and third-party integrations (Stripe, Twilio, and Nodemailer).

---

## 🏛️ Architecture & System Topology

Ecom Distributed Engine decouples monolithic e-commerce workflows into autonomous, decoupled microservices connected via resilient REST contracts and coordinated through an Nginx API Gateway.

### ASCII High-Level Architecture Diagram

```
                             +-------------------+
                             |   Client / Web    |
                             |   Mobile Apps     |
                             +---------+---------+
                                       |
                                       | HTTP :80 (Port 80)
                                       v
                     +-----------------------------------+
                     |       NGINX API GATEWAY           |
                     |  - Reverse Proxy & Route Dispatch |
                     |  - Load Balancing (Round-Robin)   |
                     |  - Header & Path Normalization    |
                     +-----------------+-----------------+
                                       |
       +-------------------------------+-------------------------------+
       |             |                 |               |               |
       v             v                 v               v               v
+-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +--------------------+
|  Identity   | |   Catalog   | |    Cart     | |    Order    | |   Billing   | |    Notification    |
|   Service   | |   Service   | |   Service   | |   Service   | |   Service   | |      Service       |
|  Port: 5000 | |  Port: 5001 | |  Port: 5002 | |  Port: 5003 | |  Port: 5004 | |     Port: 5005     |
+------+------+ +------+------+ +------+------+ +------+------+ +------+------+ +---------+----------+
       |               |               |               |               |                  |
       |               |               |   inter-svc   |   inter-svc   |                  |
       |               |               +-------+-------+-------+       |                  |
       |               |                       |               |       |                  |
       |               +<----------------------+---------------+       |                  |
       |               |        (Verify & Deduct Stock)                |                  |
       v               v               v               v               v                  v
+-------------+ +-------------+ +-------------+ +-------------+ +-------------+ +--------------------+
|   MongoDB   | |   MongoDB   | |   MongoDB   | |   MongoDB   | |   MongoDB   | | External Providers |
|ecom-identity| |ecom-catalog | |  ecom-cart  | | ecom-orders | |ecom-billing | |  - Stripe API      |
+-------------+ +-------------+ +-------------+ +-------------+ +-------------+ |  - Twilio SMS      |
                                                                                |  - SMTP Nodemailer |
                                                                                +--------------------+
```

---

### ASCII Order Checkout Flow Diagram

```
[ Client ]               [ Order Service ]             [ Catalog Service ]           [ Billing Service ]
    |                            |                              |                             |
    |-- 1. POST /checkout/:id -->|                              |                             |
    |                            |-- 2. GET /products/:id ----->|                             |
    |                            |   (Validate stock levels)    |                             |
    |                            |<-- Stock Available? ---------|                             |
    |                            |                              |                             |
    |                            |-- 3. PUT /products/:id/deduct->|                           |
    |                            |   (Atomically deduct stock)  |                             |
    |                            |<-- Stock Deducted -----------|                             |
    |                            |                                                            |
    |                            |-- 4. Create CustomerOrder in DB                            |
    |                            |                                                            |
    |-- 5. POST /payments/charge/:orderId --------------------------------------------------->|
    |                                                                                         |-- 6. Stripe Charge
    |<-- 7. Payment Confirmed & Transaction Recorded -----------------------------------------|<-- Succeeded
```

---

## 📦 Microservices Domain Breakdown

| Service Name | Directory | Primary DB Model | Port | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Identity Service** | `identity-service/` | `Account` | `5000` | Account registration, Argon2 password hashing, JWT issue & validation |
| **Catalog Service** | `catalog-service/` | `CatalogItem` | `5001` | Product taxonomy, listings, price filters, stock inventory & auto-deduction |
| **Cart Service** | `cart-service/` | `ShoppingCart` | `5002` | Persistent user shopping carts, quantity adjustments, item removal |
| **Order Service** | `order-service/` | `CustomerOrder` | `5003` | Checkout orchestration, stock validation with Catalog, status updates |
| **Billing Service** | `billing-service/` | `PaymentTransaction` | `5004` | Payment processing via Stripe API, audit logs, receipt tracking |
| **Notification Service**| `notification-service/` | *Stateless* | `5005` | Async transactional email dispatch (Nodemailer) and SMS (Twilio) |

---

## 🛠️ Technology Stack

- **Runtime & Framework**: Node.js (v18+), Express.js
- **Data Persistence**: MongoDB, Mongoose ODM (Database-per-Service architecture)
- **Security & Cryptography**: JSON Web Tokens (JWT), Argon2 password hashing
- **Gateway & Ingress**: Nginx (Reverse proxy, URI rewriting, health checks, load balancer)
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes manifests (Deployments & Services)
- **Vendor Integrations**: Stripe API, Twilio SMS, Nodemailer (SMTP)
- **Continuous Integration**: GitHub Actions CI/CD workflows

---

## 🚀 API Endpoint Reference (`/api/v1/...`)

All endpoints are accessible via the Nginx API Gateway on port `80`.

### 1. Identity & Authentication (`/api/v1/auth`)
- `POST   /api/v1/auth/register` : Register a new account (`name`, `email`, `password`)
- `POST   /api/v1/auth/login` : Authenticate account and receive JWT (`email`, `password`)
- `GET    /api/v1/auth/profile/:accountId` : Retrieve account profile details (excluding password)

### 2. Catalog & Inventory (`/api/v1/products`)
- `GET    /api/v1/products` : Retrieve all items (supports `?category=`, `?minPrice=`, `?maxPrice=`)
- `GET    /api/v1/products/:id` : Retrieve product details by ID
- `POST   /api/v1/products` : Create new product (`name`, `description`, `price`, `category`, `stock`)
- `PUT    /api/v1/products/:id` : Update existing product metadata and pricing
- `PUT    /api/v1/products/:id/deduct` : Deduct product stock (`quantity`)
- `DELETE /api/v1/products/:id` : Remove product from catalog

### 3. Shopping Cart (`/api/v1/cart`)
- `GET    /api/v1/cart/:userId` : Retrieve active shopping cart for user
- `POST   /api/v1/cart/:userId/items` : Add item to user cart (`productId`, `quantity`)
- `PATCH  /api/v1/cart/:userId/items/:productId` : Update item quantity in cart (`quantity`)
- `DELETE /api/v1/cart/:userId/items/:productId` : Remove specific item from cart
- `DELETE /api/v1/cart/:userId/clear` : Empty entire shopping cart

### 4. Order Management (`/api/v1/orders`)
- `POST   /api/v1/orders/checkout/:userId` : Validate stock, create order, deduct catalog inventory (`items`, `totalAmount`)
- `GET    /api/v1/orders/user/:userId` : Retrieve all past orders for a user
- `GET    /api/v1/orders/detail/:orderId` : Fetch specific order by its order ID
- `PATCH  /api/v1/orders/:orderId/status` : Update fulfillment status (`status`: Pending / Confirmed / Shipped / Delivered)

### 5. Billing & Payments (`/api/v1/payments`)
- `POST   /api/v1/payments/charge/:orderId` : Process payment charge (`amount`, `paymentMethodId`, `currency`)
- `GET    /api/v1/payments/transaction/:transactionId` : Retrieve transaction record by transaction ID
- `GET    /api/v1/payments/order/:orderId` : Retrieve all payment transactions tied to an order ID

### 6. Notifications & Alerts (`/api/v1/notifications`)
- `POST   /api/v1/notifications/email` : Dispatch email notification (`to`, `subject`, `text`)
- `POST   /api/v1/notifications/sms` : Dispatch SMS alert (`to`, `message`)

---

## ⚙️ Configuration & Environment Variables

Copy the `.env.example` file to create your environment config:

```bash
cp .env.example .env
```

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `MONGO_URI_IDENTITY` | MongoDB connection URI for Identity Service | `mongodb://mongo:27017/ecom-identity` |
| `MONGO_URI_CATALOG` | MongoDB connection URI for Catalog Service | `mongodb://mongo:27017/ecom-catalog` |
| `MONGO_URI_CART` | MongoDB connection URI for Cart Service | `mongodb://mongo:27017/ecom-cart` |
| `MONGO_URI_ORDER` | MongoDB connection URI for Order Service | `mongodb://mongo:27017/ecom-orders` |
| `MONGO_URI_BILLING` | MongoDB connection URI for Billing Service | `mongodb://mongo:27017/ecom-billing` |
| `JWT_SECRET` | Secret token used to sign authentication JWTs | `ecom_jwt_super_secret_key` |
| `STRIPE_SECRET_KEY` | Stripe API Secret Key for processing payments | `sk_test_...` |
| `NODEMAILER_EMAIL` | Sender email address for Nodemailer | `alerts@domain.com` |
| `NODEMAILER_PASSWORD`| App-specific password for Nodemailer SMTP | `your_app_password` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS dispatch | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_auth_token` |
| `TWILIO_PHONE_NUMBER`| Twilio virtual sender phone number | `+1234567890` |

---

## 🚀 Getting Started

### 1. Run using Docker Compose (Recommended)

Verify Docker and Docker Compose are installed:

```bash
docker --version
docker compose version
```

Launch the entire distributed engine with MongoDB, Nginx Gateway, and all 6 microservices:

```bash
docker compose up --build
```

The Nginx Gateway will listen on `http://localhost:80`. To check cluster health:

```bash
curl http://localhost/health
```

To stop all services:

```bash
docker compose down
```

---

### 2. Local Manual Development (Service by Service)

Ensure MongoDB is running locally on port `27017`. Run each service inside its respective directory:

```bash
# Identity Service
cd identity-service
npm install
npm run dev

# Catalog Service
cd ../catalog-service
npm install
npm run dev

# Cart Service
cd ../cart-service
npm install
npm run dev

# Order Service
cd ../order-service
npm install
npm run dev

# Billing Service
cd ../billing-service
npm install
npm run dev

# Notification Service
cd ../notification-service
npm install
npm run dev
```

---

## ☸️ Kubernetes Deployment

Each service contains a dedicated `deployment.yaml` and `service.yaml`. To deploy all services to a Kubernetes cluster:

```bash
kubectl apply -f identity-service/deployment.yaml -f identity-service/service.yaml
kubectl apply -f catalog-service/deployment.yaml -f catalog-service/service.yaml
kubectl apply -f cart-service/deployment.yaml -f cart-service/service.yaml
kubectl apply -f order-service/deployment.yaml -f order-service/service.yaml
kubectl apply -f billing-service/deployment.yaml -f billing-service/service.yaml
kubectl apply -f notification-service/deployment.yaml -f notification-service/service.yaml
```

---

## 🔄 CI/CD Automation (GitHub Actions)

Workflows configured in `.github/workflows/`:
1. **`build-and-test.yml`**: Installs dependencies and runs unit tests on push/PR.
2. **`build-and-push.yml`**: Builds Docker container images for all services and pushes them to Docker Hub.
3. **`deploy-kubernetes.yml`**: Authenticates and applies Kubernetes deployments and cluster services.
4. **`deploy.yml`**: Deploys the stack to Docker Swarm clusters.
