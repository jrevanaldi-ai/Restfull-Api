#!/bin/bash

# Script untuk test monitoring dashboard
# Usage: bash scripts/test-monitoring.sh

BASE_URL="http://localhost:7860"

echo "========================================="
echo "  Monitoring Dashboard Test Script"
echo "========================================="
echo ""

# Test 1: Ping endpoint
echo "🔄 Test 1: Ping endpoint (latency measurement)"
for i in {1..5}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/monitoring/ping)
  echo "  Ping #$i: HTTP $RESPONSE"
  sleep 0.5
done
echo ""

# Test 2: Stats endpoint
echo "📊 Test 2: Get server statistics"
RESPONSE=$(curl -s $BASE_URL/api/monitoring/stats | head -c 100)
echo "  Response: $RESPONSE..."
echo ""

# Test 3: Logs endpoint
echo "📋 Test 3: Get request logs"
RESPONSE=$(curl -s $BASE_URL/api/monitoring/logs | head -c 100)
echo "  Response: $RESPONSE..."
echo ""

# Test 4: Generate some traffic
echo "🚀 Test 4: Generate test traffic (20 requests)"
for i in {1..20}; do
  curl -s -o /dev/null $BASE_URL/api/monitoring/ping &
done
wait
echo "  ✓ 20 requests completed"
echo ""

# Test 5: Check updated stats
echo "📈 Test 5: Check updated statistics after traffic"
RESPONSE=$(curl -s $BASE_URL/api/monitoring/stats)
TOTAL=$(echo $RESPONSE | grep -o '"totalRequests":[0-9]*' | cut -d: -f2)
ACTIVE=$(echo $RESPONSE | grep -o '"activeIPs":[0-9]*' | cut -d: -f2)
echo "  Total Requests: $TOTAL"
echo "  Active IPs: $ACTIVE"
echo ""

# Test 6: Access monitoring page
echo "🖥️  Test 6: Access monitoring dashboard"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/monitoring)
echo "  Dashboard HTTP Status: $HTTP_CODE"
echo ""

echo "========================================="
echo "  ✅ All tests completed!"
echo "========================================="
echo ""
echo "📍 Open monitoring dashboard at:"
echo "   $BASE_URL/monitoring"
echo ""
