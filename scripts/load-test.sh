#!/bin/bash
# ============================================
# Load Test — Email Notification Service
# Tests API throughput (queuing speed, not SMTP delivery)
# ============================================

API_URL="http://localhost:3000"
API_KEY="${1:-dev-api-key-change-in-production}"
TOTAL_REQUESTS="${2:-100}"
CONCURRENCY="${3:-10}"

echo "============================================"
echo "  Email API Load Test"
echo "============================================"
echo "  URL:         $API_URL/notifications/send"
echo "  API Key:     ${API_KEY:0:10}..."
echo "  Total Reqs:  $TOTAL_REQUESTS"
echo "  Concurrency: $CONCURRENCY"
echo "============================================"
echo ""

# Check if server is up
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Server not reachable (HTTP $HTTP_CODE). Start the server first."
  exit 1
fi
echo "✅ Server is healthy"
echo ""

# Pre-test: check queue stats
echo "--- Pre-Test Queue Stats ---"
curl -s "$API_URL/notifications/stats/queue" -H "x-api-key: $API_KEY" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "(queue stats endpoint not available)"
echo ""

# Run load test
echo "🚀 Starting load test..."
START_TIME=$(date +%s%N)

SUCCESS=0
FAIL=0

# Function to send a single request
send_request() {
  local i=$1
  local RESPONSE
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}" \
    -X POST "$API_URL/notifications/send" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"email\":\"loadtest${i}@test.example.com\",\"subject\":\"Load Test #${i}\",\"body\":\"<p>Test ${i}</p>\"}" 2>/dev/null)
  echo "$RESPONSE"
}

# Run requests with concurrency using background jobs
PIDS=()
RESULTS_FILE=$(mktemp)
for ((i=1; i<=TOTAL_REQUESTS; i++)); do
  (
    RESULT=$(send_request $i)
    echo "$RESULT" >> "$RESULTS_FILE"
  ) &
  PIDS+=($!)
  
  # Throttle concurrency
  if (( ${#PIDS[@]} >= CONCURRENCY )); then
    wait "${PIDS[0]}"
    PIDS=("${PIDS[@]:1}")
  fi
  
  # Progress
  if (( i % 10 == 0 )); then
    echo "  Progress: $i / $TOTAL_REQUESTS"
  fi
done

# Wait for all remaining
for PID in "${PIDS[@]}"; do
  wait "$PID"
done

END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))
ELAPSED_SEC=$(echo "scale=2; $ELAPSED_MS / 1000" | bc)

# Parse results
SUCCESS=$(grep -c "^201|" "$RESULTS_FILE" 2>/dev/null || echo 0)
FAIL=$(grep -cv "^201|" "$RESULTS_FILE" 2>/dev/null || echo 0)
TOTAL_TIMES=$(grep -o '|[0-9.]*' "$RESULTS_FILE" | tr -d '|')
AVG_TIME=$(echo "$TOTAL_TIMES" | awk '{ sum += $1; n++ } END { if (n > 0) printf "%.3f", sum/n; else print "N/A" }')
RPS=$(echo "scale=1; $TOTAL_REQUESTS / $ELAPSED_SEC" | bc 2>/dev/null || echo "N/A")

rm -f "$RESULTS_FILE"

echo ""
echo "============================================"
echo "  RESULTS"
echo "============================================"
echo "  Total Requests:    $TOTAL_REQUESTS"
echo "  Successful (201):  $SUCCESS"
echo "  Failed:            $FAIL"
echo "  Total Time:        ${ELAPSED_SEC}s"
echo "  Requests/sec:      $RPS"
echo "  Avg Response Time: ${AVG_TIME}s"
echo "============================================"
echo ""

# Post-test: check queue stats
echo "--- Post-Test Queue Stats ---"
curl -s "$API_URL/notifications/stats/queue" -H "x-api-key: $API_KEY" 2>/dev/null | python3 -m json.tool 2>/dev/null || echo "(queue stats endpoint not available)"
echo ""

if [ "$SUCCESS" -eq "$TOTAL_REQUESTS" ]; then
  echo "✅ ALL REQUESTS QUEUED SUCCESSFULLY!"
  echo ""
  echo "💡 What this proves:"
  echo "   - API can handle $RPS requests/sec of concurrent email queueing"
  echo "   - All $TOTAL_REQUESTS emails are now in the Redis queue"
  echo "   - Worker(s) will process them async at SMTP delivery speed"
  echo ""
  echo "📈 To test higher scale:"
  echo "   ./scripts/load-test.sh YOUR_API_KEY 1000 50   # 1K emails, 50 concurrent"
  echo "   ./scripts/load-test.sh YOUR_API_KEY 10000 100  # 10K emails, 100 concurrent"
else
  echo "⚠️  Some requests failed. Check rate limiting or server logs."
fi
