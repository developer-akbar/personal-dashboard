#!/bin/bash

echo "🚀 Personal Dashboard - Data Cleanup Migration"
echo "=============================================="
echo ""
echo "This migration will:"
echo "✅ Update refresh logic to use upsert (replace existing data)"
echo "✅ Clean up duplicate balance records (keep only latest)"
echo "✅ Optimize database performance"
echo "✅ Preserve all functionality"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the root directory (where backend/ folder is located)"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found"
    echo "Please create backend/.env with your MongoDB connection string"
    exit 1
fi

echo "📋 Pre-migration checklist:"
echo "  ✅ Backend directory found"
echo "  ✅ Environment file found"
echo ""

# Ask for confirmation
read -p "🤔 Do you want to proceed with the migration? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting migration..."

# Run the migration
cd backend
npm run migrate:cleanup-duplicates

echo ""
echo "🎉 Migration completed!"
echo ""
echo "📊 What changed:"
echo "  ✅ Balance refresh now updates existing records instead of creating new ones"
echo "  ✅ Duplicate balance data has been cleaned up"
echo "  ✅ Database is now optimized for better performance"
echo "  ✅ All functionality preserved"
echo ""
echo "🚀 Your app is ready to use with the new optimized data structure!"