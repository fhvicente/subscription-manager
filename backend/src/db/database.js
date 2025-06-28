import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the directory exists
const dbDir = join(__dirname, "../../data");
// console.log(`Database directory path: ${dbDir}`);

if (!fs.existsSync(dbDir)) {
    console.log(`Creating database directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path
const dbPath = join(dbDir, "database.sqlite");
// console.log(`Database file path: ${dbPath}`);

// Output directory permissions
try {
    const dirStats = fs.statSync(dbDir);
    // console.log(`Directory permissions: ${dirStats.mode.toString(8)}`);
} catch (err) {
    console.error(`Error checking directory stats: ${err.message}`);
}

// Create a database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        // console.log(`Connected to SQLite database at ${dbPath}`);

        // Enable foreign keys
        db.run("PRAGMA foreign_keys = ON");
    }
});

// Create a promise-based wrapper for db.all
export const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Create a promise-based wrapper for db.get
export const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
};

// Create a promise-based wrapper for db.run
export const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
};

export default db;
