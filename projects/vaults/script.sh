#!/bin/bash

set -e

THRESHOLD=90
REPORT_FILE="coverage/lcov-report/index.html"

if [ ! -f "$REPORT_FILE" ]; then
  echo "❌ Coverage report not found at $REPORT_FILE"
  exit 1
fi

# Extract the percentage before the "Lines" label
COVERAGE=$(awk '
    BEGIN { RS="<div class=.fl pad1y space-right2.>"; FS="\n" }
    /Lines/ {
        for (i=1; i<=NF; i++) {
            if ($i ~ /Lines/) {
                if ((i>1) && (match($(i-1), />[0-9.]+%/))) {
                    pct = substr($(i-1), RSTART+1, RLENGTH-2);
                    print pct;
                    exit;
                }
            }
        }
    }
' "$REPORT_FILE")

if [ -z "$COVERAGE" ]; then
  echo "❌ Failed to extract 'Lines' coverage percentage."
  exit 1
fi

COVERAGE_INT=${COVERAGE%.*}

echo "🔍 Line Coverage: $COVERAGE%"

if [ "$COVERAGE_INT" -lt "$THRESHOLD" ]; then
  echo "❌ Coverage $COVERAGE% is below threshold $THRESHOLD%"
  exit 1
else
  echo "✅ Coverage threshold met."
fi
