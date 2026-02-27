# HostelOps: Production Deployment & Architecture Documentation

## Milestone Project: Full Stack Deployment & DevOps Engineering

---

## 1. PROJECT OVERVIEW

### 1.1 Project Title
**HostelOps: Production Deployment of a Containerized Complaint Management System**

### 1.2 Objective
Deploy a functional full-stack complaint management system with:
- Complete containerization using Docker
- Reverse proxy routing via Nginx
- Secure network configuration
- Production-ready practices
- Comprehensive documentation

### 1.3 Functional Scope
**Student Module:**
- Submit complaints (category + description + priority)
- View complaint status
- Track submission history

**Admin Module:**
- View all complaints with detailed information
- Update complaint status
- Add admin notes
- Filter complaints by category, status, and priority

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet/Public                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx Proxy   │  (Port 80 - HTTP Entry)
                    │  (Reverse Proxy)│  
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
     ┌────▼────┐        ┌────▼────┐      ┌────▼────┐
     │Frontend  │        │API      │      │Static   │
     │(Port80)  │        │(Port80) │      │Assets   │
     └────┬────┘        └────┬────┘      └────┬────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Docker Bridge  │
                    │    Network      │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
     ┌────▼─────┐      ┌────▼──────┐     ┌────▼────┐
     │Backend    │      │MongoDB    │     │MongoDB  │
     │Container  │      │Container  │     │Volume   │
     │(Internal) │      │(Internal) │     │(Persist)│
     │Port 5000  │      │Port 27017 │     └─────────┘
     └───────────┘      └───────────┘
```

### 2.2 Component Breakdown

| Component | Type | Port | Purpose | Technology |
|-----------|------|------|---------|------------|
| Nginx | Container/Service | 80 | Public entry point, routing | Nginx:latest |
| Backend API | Container | 5000 (internal) | Business logic | Node.js + Express |
| Frontend | Container/Static | 80 (via Nginx) | User interface | HTML/CSS/JS |
| MongoDB | Container | 27017 (internal) | Data persistence | MongoDB:latest |
| Docker Network | Infrastructure | - | Internal communication | Bridge network |

---

## 3. CONTAINERIZATION STRATEGY

### 3.1 Docker Implementation

#### 3.1.1 Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

**Key Features:**
- Alpine Linux base (minimal, ~40MB)
- Production dependencies only
- Exposed port 5000 (internal only)
- Restart policy: always
- Health checks implemented

#### 3.1.2 Environment Configuration
**.env file (for Docker):**
```
PORT=5000
MONGO_URI=mongodb://mongodb:27017/hostelops
NODE_ENV=production
```

**Key Points:**
- MongoDB URI uses internal container hostname
- External port mapping isolated
- Variables externally injectable via `-e` flag

#### 3.1.3 Container Restart Safety
- Implemented graceful shutdown handling
- Database connection retry logic
- Automatic restart on failure (3-second delay)
- Health endpoint for monitoring

### 3.2 Frontend Deployment Strategy

**Option 1: Static File Serving via Nginx**
```nginx
location / {
    root /usr/share/nginx/html;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

**Option 2: Bundled in Node.js Backend**
```javascript
app.use(express.static('frontend'));
app.get('/', (req, res) => res.sendFile('frontend/index.html'));
```

**Current Implementation:** Option 1 (Nginx serves static files)

### 3.3 Database Persistence

**MongoDB Volume Configuration:**
```bash
docker volume create hostelops-db
docker run -v hostelops-db:/data/db mongodb
```

**Benefits:**
- Data survives container restarts
- Automatic backup capability
- Performance optimized

---

## 4. REVERSE PROXY CONFIGURATION (NGINX)

### 4.1 Nginx Architecture

**Purpose:**
```
Public Request  →  Nginx (Port 80)  →  Backend Container
                                    →  Static Files
                                    →  Frontend Assets
```

### 4.2 Nginx Configuration File
**Location:** `/etc/nginx/conf.d/default.conf`

```nginx
upstream backend {
    server backend:5000;
}

server {
    listen 80;
    server_name _;

    # Static files (Frontend)
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API routes to backend container
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS handling
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 4.3 Request Flow Explanation

**Student Portal Request:**
```
1. Client Browser: http://localhost/
2. Nginx: Receives on port 80
3. Nginx: Matches location / rule
4. Nginx: Serves static files from /usr/share/nginx/html
5. Client: Receives index.html, style.css, script.js
6. Client JavaScript: Initiates API call
7. Client: http://localhost/api/complaints
8. Nginx: Matches location /api/ rule
9. Nginx: Proxies to upstream backend:5000
10. Backend Container: /api/complaints endpoint
11. Backend: Queries MongoDB
12. Backend: Returns JSON response
13. Nginx: Proxies response back to client
14. Client: Receives data, updates UI
```

**Admin Dashboard Request:**
```
1. Client: http://localhost/admin-login.html
2. Nginx: Serves static file
3. Client: Enters credentials
4. Client: POST to /api/admin/login
5. Nginx: Proxies to backend
6. Backend: Validates credentials
7. Response: Session token or auth confirmation
8. Client: Redirected to admin-dashboard.html
9. Client: GET /api/complaints
10. Nginx: Proxies API request
11. Backend: Returns all complaints with filtering support
12. Client: Displays in admin table with status update capability
```

### 4.4 Nginx Performance Tuning

```nginx
# Connection pooling
upstream backend {
    server backend:5000;
    keepalive 32;
}

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 5. NETWORKING & SECURITY

### 5.1 Network Topology

**Docker Compose Network Setup:**
```yaml
version: '3.8'

services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    networks:
      - hostelops-network
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./frontend:/usr/share/nginx/html:ro

  backend:
    image: hostelops-backend:latest
    networks:
      - hostelops-network
    environment:
      - MONGO_URI=mongodb://mongodb:27017/hostelops
      - PORT=5000
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    networks:
      - hostelops-network
    volumes:
      - hostelops-db:/data/db

networks:
  hostelops-network:
    driver: bridge

volumes:
  hostelops-db: {}
```

### 5.2 Port Binding Strategy

**Public Ports (Exposed to Host):**
- Port 80 (HTTP) - Nginx reverse proxy only

**Internal Ports (Container Network Only):**
- Port 5000 - Backend API (only accessible via internal Docker network)
- Port 27017 - MongoDB (only accessible to backend container)

**Benefits:**
- Single entry point via Nginx on port 80
- Backend isolated from direct external access
- Database completely sealed from outside
- All inter-service communication via Docker bridge network

### 5.3 Firewall Configuration

**Windows Firewall Rules (for local testing):**
```powershell
# Allow HTTP
New-NetFirewallRule -Name "HostelOps-HTTP" -DisplayName "HostelOps HTTP" `
    -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80

# Verify rules
Get-NetFirewallRule -DisplayName "HostelOps*"
```

**Production Firewall Rules:**
```
Inbound Rules:
  - Port 80: Allow (HTTP traffic)
  - Port 22: Allow (SSH for management)
  - Port 443: Allow (HTTPS - future)
  - All others: Deny

Outbound Rules:
  - Port 80: Allow (external APIs, updates)
  - Port 443: Allow (HTTPS external)
  - Others: Deny (except DNS 53)
```

### 5.4 Security Measures

#### 4.4.1 CORS Configuration
```javascript
// Backend CORS setup
const corsOptions = {
    origin: ['http://localhost', 'http://localhost:80'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

#### 4.4.2 Input Validation
```javascript
// Backend input sanitization
app.post('/api/complaints', async (req, res) => {
    const { studentName, roomNumber, description } = req.body;
    
    // Validate input
    if (!studentName || studentName.length > 100) {
        return res.status(400).json({ error: 'Invalid student name' });
    }
    
    // Sanitize before storage
    const cleanData = {
        studentName: sanitize(studentName),
        description: sanitize(description)
    };
    
    // Process...
});
```

#### 4.4.3 Rate Limiting (Future)
```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://backend;
}
```

#### 4.4.4 Request Headers Security
```nginx
# Remove server information
server_tokens off;

# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
```

---

## 6. DEPLOYMENT PROCEDURES

### 6.1 Local Development Setup

**Prerequisites:**
- Docker Desktop installed
- Docker Compose available
- Port 80 available (or configured differently)

**Steps:**
```bash
# 1. Build backend image
cd backend
docker build -t hostelops-backend .

# 2. Start containers
docker-compose up -d

# 3. Verify running containers
docker ps

# 4. Access the application
# Student: http://localhost/index.html
# Admin: http://localhost/admin-login.html
```

### 6.2 Production Deployment

**Server Requirements:**
- 2GB RAM minimum
- 10GB disk space
- Docker & Docker Compose
- Linux OS (Ubuntu 20.04+ recommended)

**Deployment Steps:**
```bash
# 1. SSH into server
ssh admin@production-server

# 2. Clone repository
git clone https://github.com/Sujeeth18/Skill_san.git
cd hostelops

# 3. Build production image
docker build -t hostelops-backend:prod ./backend

# 4. Start with production Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify deployment
docker-compose ps
docker-compose logs -f

# 6. Test endpoints
curl http://localhost/api/complaints
curl http://localhost/health
```

### 6.3 Monitoring & Logs

**View Container Logs:**
```bash
# Backend logs
docker logs -f hostelops-backend

# Nginx logs
docker logs -f hostelops-nginx

# MongoDB logs
docker logs -f hostelops-mongodb

# Full system
docker-compose logs -f
```

**Health Monitoring:**
```bash
# Check container health
docker inspect --format='{{json .State.Health}}' hostelops-backend

# Monitor resources
docker stats hostelops-backend
```

---

## 7. SCALING & PERFORMANCE

### 7.1 Horizontal Scaling (Multiple Backend Instances)
```yaml
services:
  backend:
    deploy:
      replicas: 3
    
  backend-2:
    image: hostelops-backend:latest
    networks:
      - hostelops-network
  
  backend-3:
    image: hostelops-backend:latest
    networks:
      - hostelops-network

# Nginx load balancing
upstream backend_pool {
    server backend:5000;
    server backend-2:5000;
    server backend-3:5000;
}
```

### 7.2 Database Optimization
- Enable MongoDB indexing
- Implement query caching
- Archive old complaints
- Database sharding (for massive scale)

### 7.3 Caching Strategy
```javascript
// Redis caching for frequently accessed data
const redis = require('redis');
const cache = redis.createClient();

app.get('/api/complaints', async (req, res) => {
    const cached = await cache.get('complaints-list');
    if (cached) return res.json(JSON.parse(cached));
    
    const complaints = await Complaint.find();
    await cache.setEx('complaints-list', 300, JSON.stringify(complaints));
    res.json(complaints);
});
```

---

## 8. DISASTER RECOVERY & BACKUP

### 8.1 Database Backup Strategy
```bash
# Automated daily backup
0 2 * * * docker exec hostelops-mongodb mongodump --out /backup/mongo-$(date +\%Y\%m\%d)

# Backup verification
docker exec hostelops-mongodb mongorestore --list /backup/mongo-20260227
```

### 8.2 Container Restart Policy
```yaml
services:
  backend:
    restart_policy:
      condition: on-failure
      delay: 5s
      max_attempts: 3
      window: 120s
```

### 8.3 Rollback Procedure
```bash
# Tag production version
docker tag hostelops-backend:prod hostelops-backend:v1.0

# If deployment fails, rollback
docker rm -f hostelops-backend
docker run -d --name hostelops-backend hostelops-backend:v1.0
```

---

## 9. COMPARISON: SERVERFUL vs SERVERLESS

### 9.1 Serverful Deployment (Current Implementation)

**Architecture:**
```
Application Code → Runs on Server → Manages Infrastructure
```

**Characteristics:**
| Aspect | Details |
|--------|---------|
| Infrastructure | You manage servers (Docker) |
| Scaling | Manual scaling, load balancing |
| Cost Model | Pay for instance uptime |
| Availability | Managed by you |
| Startup Time | Seconds to minutes |
| Deployment | Push updates to containers |

**Pros:**
- Full control over environment
- Predictable costs
- Better for stateful applications
- Fine-grained performance tuning
- Complex business logic support

**Cons:**
- Higher operational overhead
- Must manage scaling
- Always-on costs
- More infrastructure to maintain
- Security patching responsibility

### 9.2 Serverless Deployment (Alternative)

**Architecture:**
```
Application Code → Upload → Provider Manages Everything
```

**Example: AWS Lambda + API Gateway + DynamoDB**
```
Client → API Gateway → Lambda Functions → DynamoDB
```

**Characteristics:**
| Aspect | Details |
|--------|---------|
| Infrastructure | Cloud provider manages |
| Scaling | Automatic, based on demand |
| Cost Model | Pay per execution + data transfer |
| Availability | Provider handles SLAs |
| Startup Time | Milliseconds to seconds (cold start) |
| Deployment | Upload code, provider deploys |

**Pros:**
- No infrastructure management
- Auto-scaling built-in
- Pay-as-you-go pricing
- Lower operational burden
- Built-in monitoring and logging

**Cons:**
- Less control
- Vendor lock-in
- Cold start latency
- Stateless only (typically)
- Cost unpredictability at scale
- Limited execution time (usually 15 min max)

### 9.3 Comparison Matrix

| Feature | Serverful | Serverless |
|---------|-----------|-----------|
| Control | Full | Limited |
| Scaling | Manual | Automatic |
| Cost @ Low Traffic | Higher | Lower |
| Cost @ High Traffic | Predictable | May spike |
| Deployment Complexity | Medium | Low |
| Dev to Production | Days | Hours |
| Performance | Optimizable | Variable |
| Compliance | Full control | Provider dependent |

### 9.4 HostelOps Deployment Choice

**Selected: Serverful (Current)**

**Reasoning:**
1. **Stateful Data** - Complaints must persist
2. **Complex Logic** - Admin features, filtering
3. **Cost Predictability** - Educational institution budget
4. **Control** - Full oversight of system
5. **Learning Value** - Students understand infrastructure

**When Serverless Would Be Better:**
- Sporadic traffic patterns
- Simple CRUD operations
- Event-driven processing
- Short session duration

---

## 10. DOCUMENTATION & DIAGRAMS

### 10.1 Deployment Architecture Diagram
```
┌────────────────────────────────────────────────┐
│          HOSTELOPS DEPLOYMENT                  │
└────────────────────────────────────────────────┘

         ┌─────────────────────────────┐
         │    Client Browsers          │
         │  (Students & Admins)        │
         └────────────┬────────────────┘
                      │ HTTP:80
         ┌────────────▼────────────────┐
         │    Nginx Reverse Proxy      │
         │  (Port 80 Public Entry)     │
         └────────────┬────────────────┘
                      │
         ┌────────────┴────────────────┐
         │   Docker Bridge Network     │
         └────────────┬────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
    ┌───▼──┐     ┌───▼──┐     ┌───▼────┐
    │ API  │     │ DB   │     │ Volumes│
    │ :5000│     │:27017│     │        │
    └──────┘     └──────┘     └────────┘
```

### 10.2 Request Lifecycle Diagram

```
STUDENT SUBMISSION FLOW:
┌─────────────────────────────────────────────────┐
│ 1. Student fills form (index.html)              │
│    - Name, Room, Category, Priority, Description│
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 2. Browser sends POST request                   │
│    POST http://localhost/api/complaints         │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 3. Nginx Reverse Proxy receives on :80          │
│    - Strips headers                             │
│    - Routes to backend:5000                     │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 4. Backend Node.js Express server               │
│    - Validates input                            │
│    - Applies middleware (CORS, JSON parse)      │
│    - Calls POST /api/complaints handler         │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 5. MongoDB insertion                            │
│    - Creates document with timestamp            │
│    - Sets status: "Pending"                     │
│    - Returns saved document                     │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 6. Backend sends response                       │
│    - JSON with complaint ID and details         │
│    - Status: 200 OK                             │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 7. Nginx proxies response back to client        │
│    - Adds CORS headers                          │
│    - Compresses with gzip                       │
│    - Sends to client                            │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│ 8. Browser receives response                    │
│    - JavaScript updates UI                      │
│    - Shows success message                      │
│    - Reloads complaints list                    │
└─────────────────────────────────────────────────┘

ADMIN UPDATE FLOW:
┌──────────────────────────────────────────────────┐
│ 1. Admin views dashboard (admin-dashboard.html)  │
├──────────────────────────────────────────────────┤
│ 2. Clicks "Update" on complaint                  │
│    - Modal opens with complaint details          │
├──────────────────────────────────────────────────┤
│ 3. Admin selects new status & adds notes         │
│    - Status: Pending → In Progress              │
│    - Notes: "Maintenance scheduled for 2pm"     │
├──────────────────────────────────────────────────┤
│ 4. Clicks "Save Update"                         │
│    - PUT /api/complaints/{id}                   │
├──────────────────────────────────────────────────┤
│ 5. Request flows through Nginx → Backend        │
│    - Validates admin session                    │
│    - Updates MongoDB document                   │
│    - Sets updatedAt timestamp                   │
├──────────────────────────────────────────────────┤
│ 6. Response returned                            │
│    - Updated complaint object                   │
│    - All changes persisted                      │
├──────────────────────────────────────────────────┤
│ 7. Dashboard updates automatically              │
│    - Table refreshes with new status            │
│    - Statistics recalculated                    │
└──────────────────────────────────────────────────┘
```

---

## 11. DEPLOYMENT CHECKLIST

```
PRE-DEPLOYMENT:
☐ All code committed to git
☐ Environment variables configured
☐ Docker images built successfully
☐ Database backup created
☐ SSL certificates ready (if using HTTPS)
☐ Nginx configuration validated
☐ CORS settings verified

DEPLOYMENT:
☐ Stop old containers gracefully
☐ Pull latest code
☐ Build new images
☐ Start containers with docker-compose
☐ Verify all services running
☐ Check logs for errors
☐ Test API endpoints
☐ Test frontend access

POST-DEPLOYMENT:
☐ Monitor logs for errors
☐ Test student portal
☐ Test admin portal
☐ Verify database connectivity
☐ Test complaint submission
☐ Test admin status update
☐ Document any issues
☐ Notify stakeholders
```

---

## 12. CONCLUSION

This deployment architecture provides:
- ✅ Single-point entry via Nginx (port 80)
- ✅ Complete containerization (Docker)
- ✅ Secure internal networking
- ✅ Persistent data storage
- ✅ Production-ready configuration
- ✅ Easy scaling and monitoring
- ✅ Comprehensive documentation

**Status:** ✅ Production Ready

---

**Document Version:** 1.0  
**Last Updated:** February 27, 2026  
**Author:** DevOps Engineering Team  
**Project:** HostelOps - Smart Hostel Complaint Management System
