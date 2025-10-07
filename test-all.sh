#!/bin/bash

echo "Running all tests..."
echo "===================="

echo "Frontend tests:"
npm test

echo ""
echo "Backend tests:"
cd backend && npm test && cd ..

echo ""
echo "All tests completed!"
