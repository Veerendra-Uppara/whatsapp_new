# Quick Start with Supabase

## Current Status
❌ **Currently using SQLite** (local database)

## To Switch to Supabase PostgreSQL:

### Option 1: Run with Password (One Command)
```powershell
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.wbpfuwgshznenphtvmwe.supabase.co:5432/postgres"; cd server; node index.js
```
Replace `YOUR_PASSWORD` with your actual Supabase database password.

### Option 2: Use the Script
```powershell
.\run-with-supabase.ps1
```
This will prompt you for your password securely.

## How to Verify It's Using Supabase

When the server starts, look for this message:
- ✅ **SUCCESS**: `✅ Connected to PostgreSQL database (Supabase)`
- ❌ **FAILED**: `Connected to SQLite database (local dev)`

## Your Supabase Connection Details
- Host: `db.wbpfuwgshznenphtvmwe.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: *[You need to provide this]*

## Need Help?
If you don't know your Supabase password:
1. Go to https://supabase.com
2. Log into your project
3. Go to **Settings** → **Database**
4. Look for "Connection string" or reset your database password

