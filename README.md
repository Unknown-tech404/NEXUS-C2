
# 🚀 NEXUS-C2

**Advanced Command & Control Platform for Educational Research & Security Auditing**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue.svg)](https://expressjs.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📖 Overview

**NEXUS-C2** is a sophisticated, modular Command & Control (C2) platform designed for **educational research**, **penetration testing**, and **security awareness training**. It demonstrates advanced client-side data collection techniques using modern web technologies.

> ⚠️ **IMPORTANT DISCLAIMER**: This tool is intended for **authorized security testing and educational purposes only**. Users are solely responsible for ensuring compliance with all applicable laws and regulations. The developers assume no liability for misuse.

---

## ✨ Key Features

### 🎯 Core Capabilities
- **Live Dashboard** – Real-time monitoring and statistics
- **Template Engine** – Dynamic phishing page deployment with 8+ pre-built templates
- **Multi-Data Capture** – Webcam (front/back), microphone, screenshot, GPS, clipboard, cookies, keystrokes
- **Device Fingerprinting** – OS, browser, screen resolution, battery status, hardware concurrency
- **Geolocation Mapping** – Yandex Maps integration for victim location tracking
- **Timeline View** – Complete audit trail per victim
- **Export Reports** – CSV & PDF generation for analysis

### 🛡️ Security & Control
- **Session-Based Authentication** – Secure admin access
- **Local JSON Storage** – No external database required
- **Cloudflare Tunnel Support** – Expose local server securely
- **Auto-Cleanup** – Database wipe functionality

---

## 🖥️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express.js |
| **Frontend** | EJS, Tailwind CSS, Chart.js |
| **Templating** | EJS (Server-side), HTML (Client templates) |
| **Data Storage** | JSON (Local filesystem) |
| **Authentication** | Session-based (express-session, bcrypt) |
| **Mapping** | Yandex Maps API (no key required) |
| **Tunneling** | Cloudflare Tunnel (optional) |

---

## 📁 Project Structure

```
nexus-c2/
├── server.js                 # Main application entry point
├── package.json              # Dependencies & scripts
├── .env                      # Environment variables (optional)
│
├── public/                   # Static assets
│   ├── css/                  # Stylesheets
│   └── js/                   # Client-side scripts
│
├── views/                    # EJS templates (UI)
│   ├── dashboard.ejs         # Main control panel
│   ├── login.ejs             # Authentication page
│   └── capture.ejs           # Fallback capture page
│
├── templates/                # Phishing page templates (HTML)
│   ├── ai-chat.html
│   ├── fb-followers.html
│   ├── fb.html
│   ├── free-data.html
│   ├── google.html
│   ├── ig.html
│   ├── premium-offer.html
│   ├── secret-message.html
│   └── ultimate.html
│
├── captures/                 # Captured media (images, audio, screenshots)
├── data/                     # JSON data storage
│   ├── logs.json             # Victim logs
│   ├── users.json            # Admin credentials
│   ├── links.json            # Generated link records
│   ├── captures.json         # Media metadata
│   └── timeline.json         # Victim timeline
│
└── README.md                 # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- (Optional) **Cloudflared** for public tunneling

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/Unknown-tech404/NEXUS-C2.git
cd NEXUS-C2
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the server**
```bash
npm start
```

4. **Access the dashboard**
```
http://localhost:3000
```

5. **Default login credentials**
```
Username: admin
Password: nexus2026
```

---

## 🎯 Usage Guide

### 1. Authentication
- Navigate to `http://localhost:3000`
- Login with default credentials or register a new account
- Session remains active for 24 hours

### 2. Dashboard Overview
- **Command View** – Statistics, charts, live counters
- **Live Intercepts** – Real-time victim data (IP, location, device, credentials)
- **Captured Gallery** – View images, audio, and screenshots
- **Timeline** – Victim activity timeline with keystroke logs
- **Asset Management** – Browse and select templates
- **Deployment** – Generate phishing links with selected templates
- **Operator Profile** – Manage account and view statistics

### 3. Generating a Phishing Link
1. Go to **Deployment** tab
2. Select a template from the dropdown
3. Set a redirect URL (e.g., `https://google.com`)
4. Click **Generate Payload**
5. Copy the generated link and distribute it

### 4. Viewing Captured Data
- **Live Intercepts**: See IP, location, device info, credentials
- **Captured Gallery**: Click on any item to view metadata and download
- **Timeline**: Click **View Details** for complete audit trail

### 5. Exporting Reports
- **CSV Export**: Download all logs in CSV format
- **PDF Export**: Generate a formatted PDF report

---

## 🔧 Configuration

### Environment Variables (.env)
Create a `.env` file in the root directory:

```env
PORT=3000
SESSION_SECRET=your_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=nexus2026
```

### Adding Custom Templates
1. Create a new HTML file in the `templates/` directory
2. Include the data collection script (see existing templates for reference)
3. The template will automatically appear in the Asset Management panel

### Enabling Public Tunneling (Cloudflare)
```bash
# Install Cloudflared
curl -L --output cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Run tunnel in a separate terminal
cloudflared tunnel --url http://localhost:3000
```

---

## 📚 Available Templates

| Template | Description | Capture Features |
|----------|-------------|------------------|
| **Aura AI** | Futuristic AI chat interface | All data, auto-trigger after 2 messages |
| **FB Followers** | Free Facebook followers offer | All data + Facebook URL |
| **FB** | Classic Facebook login | Credentials + all data |
| **Free Data** | 5GB mobile data giveaway | All data + phone number |
| **Google** | Google sign-in clone | Credentials + all data |
| **IG** | Instagram login clone | Credentials + all data |
| **Premium Offer** | Premium access with countdown | All data + email/username |
| **Secret Message** | Auto-typing decryption tool | All data + username/password |
| **Ultimate** | Full-featured data collection | All data + comprehensive metadata |

---

## 🛠️ API Endpoints

### Authenticated Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs` | Fetch all logs |
| GET | `/api/captures` | Fetch capture metadata |
| GET | `/api/timelines` | Fetch victim timelines |
| GET | `/api/map` | Fetch geolocation data |
| GET | `/api/stats` | Get statistics |
| GET | `/api/export/csv` | Export CSV report |
| GET | `/api/export/pdf` | Export PDF report |
| DELETE | `/api/logs/:id` | Delete specific log |
| DELETE | `/api/captures/:id` | Delete specific capture |

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/capture/:id` | Phishing page access |
| POST | `/upload/:template` | Data submission endpoint |

---

## 🔒 Security Considerations

1. **Change default credentials** immediately after first login
2. **Use HTTPS** in production environments
3. **Restrict access** to authorized IPs if possible
4. **Regularly clear** old logs and captures
5. **Monitor** for unauthorized access attempts
6. **Keep dependencies** updated (`npm audit fix`)

---

## 📝 Legal & Ethical Use

**NEXUS-C2** is provided for:
- ✅ **Educational research** on social engineering techniques
- ✅ **Security awareness training** in controlled environments
- ✅ **Penetration testing** with explicit written authorization
- ✅ **Academic study** of client-side data collection methods

**Prohibited uses include:**
- ❌ Unauthorized surveillance or spying
- ❌ Harassment or stalking
- ❌ Identity theft or fraud
- ❌ Any illegal activity as defined by local jurisdiction

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Guidelines:**
- Maintain code quality and consistency
- Document any new features or changes
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **GitHub Issues**: [Report a bug](https://github.com/Unknown-tech404/NEXUS-C2/issues)
- **Discussions**: [Open a discussion](https://github.com/Unknown-tech404/NEXUS-C2/discussions)

---

## ⚠️ Final Warning

> **THIS TOOL IS FOR EDUCATIONAL AND AUTHORIZED TESTING PURPOSES ONLY.**  
> The developers do not condone illegal or unethical use. Users are fully responsible for their actions and must comply with all applicable laws.

---

**Built with ❤️ for the cybersecurity community**  
*NEXUS-C2 v3.0 • 2026*

