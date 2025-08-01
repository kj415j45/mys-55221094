#!/bin/bash

echo "Testing MYS API with updated headers..."

cd "$(dirname "$0")"

# Compile the project
echo "Compiling TypeScript..."
npx tsc

if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ TypeScript compilation successful"

# Test with very short limits to verify it works
echo "Running API test with short limits..."
MAX_RUNTIME=10 MAX_ITERATIONS=5 LOG_LEVEL=info node dist/index.js

if [ $? -eq 0 ]; then
    echo "✅ API test completed successfully"
    echo "✅ All tests passed!"
else
    echo "❌ API test failed"
    exit 1
fi