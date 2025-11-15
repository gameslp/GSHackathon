# HackathonHub

**The World's Leading Data Science Competition Platform**

---

## 🎯 Platform Overview

HackathonHub is a comprehensive platform for organizing and participating in data science competitions. It combines enterprise-grade security with powerful automation features, enabling organizers to run professional ML competitions with minimal effort while providing participants with instant feedback and real-time rankings.

---

## ✨ Core Features

### 🏆 Advanced Hackathon Configuration

**Complete Control Over Competition Setup:**

- Define challenge types (Classification, Regression, NLP, Computer Vision, Time Series)
- Set prize amounts, registration periods, and competition dates
- Configure team sizes (min/max members) for solo or collaborative challenges
- Upload custom thumbnails for visual branding
- Add external resources (datasets, papers, guides)
- Define required submission file formats with descriptions

**Resource Management:**

- Upload training/test datasets with public/private visibility control
- Provide helper files that become accessible upon team acceptance
- Set submission limits to ensure fair competition
- Configure Docker resource limits (CPU threads, RAM, timeout)

**Custom Survey System:**

- Create tailored questionnaires for team applications
- Collect participant information (experience level, skills, tools)
- Review responses before accepting teams
- Use data to ensure balanced competition or gather research insights

### 👥 Flexible Team Management

**Easy Team Formation:**

- Create teams with unique 6-digit invitation codes
- Join existing teams using shared codes
- Automatic survey completion during registration
- Support for any team size (solo competitors to large groups)

**Team Administration:**

- Review all team applications with survey responses
- Accept or reject teams manually for quality control
- View team member details and completion status
- Track team activity and submission history

### 🤖 Automated Solution Evaluation

**Docker-Based Auto-Scoring:**

- Upload a Python evaluation script that compares solutions
- System automatically runs scripts in isolated Docker containers
- Instant score calculation and leaderboard updates
- Support for any evaluation metric (accuracy, RMSE, MAPE, F1, custom)
- Batch rejudge capability when updating scoring logic

**Security & Isolation:**

- Each submission runs in a temporary, disposable container
- Complete network isolation
- Read-only filesystem prevents system modification
- Configurable resource limits (CPU, RAM, execution time)
- No privilege escalation possible
- Automatic cleanup after execution

### ⚖️ Judge System

**Dedicated Judge Role:**

- Specialized dashboard showing all assigned hackathons
- Manual scoring capability when auto-evaluation is disabled
- Trigger rejudge for specific submissions
- Full access to team files and submission history
- Independent of organizer role for transparency

### 📊 Real-Time Leaderboards

**Live Competition Rankings:**

- Automatic score updates after each submission
- Real-time position tracking for all teams
- Public visibility of rankings and scores
- Historical submission tracking
- Fair play enforcement through submission limits

### 🔐 Enterprise Security

**Two-Factor Authentication:**

- Google Authenticator integration (TOTP)
- QR code generation during registration
- 6-digit time-based codes for login
- JWT tokens in httpOnly cookies (XSS protection)
- Secure session management

**Role-Based Access Control:**

- **PARTICIPANT:** Team participation, submissions, leaderboard access
- **JUDGE:** Manual evaluation, assigned hackathon management
- **ADMIN:** Full platform control, hackathon creation, user management

**File Security:**

- Provided files restricted to accepted team members
- Submission files accessible only to team, judges, and admins
- Upload validation (type, size, format)
- Secure storage outside public directories

---

## 🚀 Quick Start

**Prerequisites:** Node.js 20+, Docker, MySQL 8.0, Google Authenticator app

**Installation:**

1. Clone repository and start MySQL:

   ```
   git clone https://github.com/JohnThePenguin/GSHackathon.git
   cd GSHackathon
   ```

2. Setup Backend:

   ```
   Docker compose up --build -d
   ```

3. Setup Frontend:

   ```
   cd src/frontend
   npm install && npm run dev -- --port 3001
   ```

4. Build ML Sandbox:
   ```
   cd src/backend/src/docker
   docker build -f Dockerfile.ml -t ml-sandbox:latest .
   ```

**Access:** Frontend at http://localhost:3001 | API at http://localhost:3000 | Docs at http://localhost:3000/api-docs

---

## 🌟 What Makes HackathonHub Special

- ✅ **Zero-Config Auto-Scoring** - Upload one Python script for fully automated evaluation
- ✅ **Enterprise Security** - 2FA + Docker isolation + role-based access control
- ✅ **Flexible Team Management** - Any team size, invitation codes, custom surveys
- ✅ **Judge System** - Dedicated role for independent manual evaluation
- ✅ **Rich ML Ecosystem** - Pre-built Docker with TensorFlow, PyTorch, XGBoost, 20+ libraries
- ✅ **Real-time Leaderboards** - Instant score updates and live rankings
- ✅ **Production Ready** - Built for competitions with thousands of participants

---

## 🤖 AI-Assisted Development

This project was developed with the assistance of AI coding agents to accelerate development and ensure code quality. We leveraged:

- **GitHub Copilot** for intelligent code completion and suggestions
- **AI-powered code review** to identify potential issues early
- **Automated testing assistance** to maintain high test coverage
- **Documentation generation** for comprehensive API and code documentation

By integrating AI tools into our development workflow, we were able to:

- ⚡ Reduce development time significantly
- 🎯 Focus on architecture and business logic rather than boilerplate
- 🔍 Catch bugs and security issues proactively
- 📚 Maintain consistent, high-quality documentation

This demonstrates how AI can augment developer productivity while maintaining full control over the codebase architecture and design decisions.

---

## 📝 License & Contributing

**License:** MIT | **Authors:** JohnThePenguin, gameslp, m-zagajewski, Dariooo23

Contributions welcome! Check the [issues page](https://github.com/JohnThePenguin/GSHackathon/issues)

---

<div align="center">Made with ❤️ for the data science community</div>
