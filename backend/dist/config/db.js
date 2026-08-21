"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.transaction = exports.getClient = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const DEFAULT_SUPABASE_HOST = 'aws-1-ap-south-1.pooler.supabase.com';
const DEFAULT_SUPABASE_PORT = '6543';
const DEFAULT_SUPABASE_DB = 'postgres';
const DEFAULT_SUPABASE_USER = 'postgres.ejtnanmgqtxhohymvcir';
const DEFAULT_SUPABASE_PASS = 'system-ERP147*';
const host = process.env.DB_HOST || (isProduction ? DEFAULT_SUPABASE_HOST : 'localhost');
const port = parseInt(process.env.DB_PORT || (isProduction ? DEFAULT_SUPABASE_PORT : '5432'));
const database = process.env.DB_NAME || (isProduction ? DEFAULT_SUPABASE_DB : 'stitch_erp');
const user = process.env.DB_USER || (isProduction ? DEFAULT_SUPABASE_USER : 'postgres');
const password = process.env.DB_PASSWORD || (isProduction ? DEFAULT_SUPABASE_PASS : 'postgres');
const connectionConfig = process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? {
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    }
    : {
        host,
        port,
        database,
        user,
        password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: host !== 'localhost' ? { rejectUnauthorized: false } : false,
    };
const pool = new pg_1.Pool(connectionConfig);
pool.on('connect', () => {
    // console.log('New client connected to PostgreSQL pool');
});
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development' && duration > 1000) {
            console.warn('Slow query detected:', { text, duration, rows: res.rowCount });
        }
        return res;
    }
    catch (error) {
        console.error('Database query error:', { text, error });
        throw error;
    }
};
exports.query = query;
const getClient = () => pool.connect();
exports.getClient = getClient;
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
const testConnection = async () => {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection successful');
    }
    finally {
        client.release();
    }
    // Run multi-currency schema migrations safely
    const { runMultiCurrencyMigration } = await Promise.resolve().then(() => __importStar(require('./migrateMultiCurrency')));
    await runMultiCurrencyMigration();
};
exports.testConnection = testConnection;
exports.default = pool;
//# sourceMappingURL=db.js.map