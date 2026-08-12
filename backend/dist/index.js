"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const audit_1 = require("./middleware/audit");
const auth_1 = __importDefault(require("./routes/auth"));
const setup_1 = __importDefault(require("./routes/setup"));
const accounting_1 = __importDefault(require("./routes/accounting"));
const inventory_1 = __importDefault(require("./routes/inventory"));
const sales_1 = __importDefault(require("./routes/sales"));
const cashBanks_1 = __importDefault(require("./routes/cashBanks"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000');
// ── Security Middleware ──────────────────────────────────────────
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// ── CORS Configuration ───────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, serverless) or any matching domain
        if (!origin || process.env.NODE_ENV !== 'production' || process.env.FRONTEND_URL === '*' || origin.includes('vercel.app') || origin === process.env.FRONTEND_URL) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive CORS for deployed Vercel apps
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ── Body Parsers ─────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Request Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('dev'));
}
// ── Path Normalization Middleware for Serverless ──────────────────
app.use((req, _res, next) => {
    if (!req.url.startsWith('/api/') && req.url !== '/api') {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    next();
});
// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'ERP API Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});
// ── API Routes ───────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/setup', setup_1.default);
app.use('/api/accounting', accounting_1.default);
app.use('/api/inventory', inventory_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/cash-banks', cashBanks_1.default);
// ── 404 Handler ──────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'المسار غير موجود' });
});
// ── Global Error Handler ─────────────────────────────────────────
app.use(audit_1.errorHandler);
// ── Start Server (Only in Standalone Mode, Not Vercel Serverless) ─
if (!process.env.VERCEL) {
    const startServer = async () => {
        try {
            await (0, db_1.testConnection)();
            app.listen(PORT, () => {
                console.log(`\n🚀 ERP API Server running on http://localhost:${PORT}`);
                console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
                console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth/login\n`);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    };
    startServer();
}
exports.default = app;
//# sourceMappingURL=index.js.map