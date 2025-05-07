#!/bin/bash

set -e


# the thresholds below are supposed to be cahnged (but only ^increased)
#! DO NOT decrease the values, if coverage does not meet the threshold – write new tests 
DEFAULT_THRESHOLD=90
THRESHOLD_STATEMENTS=95
THRESHOLD_BRANCHES=79
THRESHOLD_FUNCTIONS=95
THRESHOLD_LINES=96


THRESHOLD_STATEMENTS=${THRESHOLD_STATEMENTS:-$DEFAULT_THRESHOLD}
THRESHOLD_BRANCHES=${THRESHOLD_BRANCHES:-$DEFAULT_THRESHOLD}
THRESHOLD_FUNCTIONS=${THRESHOLD_FUNCTIONS:-$DEFAULT_THRESHOLD}
THRESHOLD_LINES=${THRESHOLD_LINES:-$DEFAULT_THRESHOLD}


REPORT_FILE="./coverage/index.html"

echo "Thresholds: Lines:$THRESHOLD_LINES%, Statements:$THRESHOLD_STATEMENTS%, Functions:$THRESHOLD_FUNCTIONS%, Branches:$THRESHOLD_BRANCHES%"

if [ ! -f "$REPORT_FILE" ]; then
  echo "❌ Coverage report not found at $REPORT_FILE"
  exit 1
fi

extract_coverage() {
  local label=$1
  awk -v target="$label" '
    BEGIN { RS="<div class=.fl pad1y space-right2.>"; FS="\n" }
    $0 ~ target {
      for (i=1; i<=NF; i++) {
        if ($i ~ target) {
          if ((i>1) && (match($(i-1), />[0-9.]+%/))) {
            pct = substr($(i-1), RSTART+1, RLENGTH-2);
            print pct;
            exit;
          }
        }
      }
    }
  ' "$REPORT_FILE"
}

check_threshold() {
  local type=$1
  local value=$2
  local threshold=$3
  local value_int=${value%.*}

  echo "⚪ $type coverage: $value%"

  if [ "$value_int" -lt "$threshold" ]; then
    echo "❌ $type coverage $value% is below threshold $threshold%"
    exit 1
  # else
  #   echo "✅ $type coverage meets threshold"
  fi
}

LINES=$(extract_coverage "Lines")
STATEMENTS=$(extract_coverage "Statements")
FUNCTIONS=$(extract_coverage "Functions")
BRANCHES=$(extract_coverage "Branches")

check_threshold "Lines" "$LINES" "$THRESHOLD_LINES"
check_threshold "Statements" "$STATEMENTS" "$THRESHOLD_STATEMENTS"
check_threshold "Functions" "$FUNCTIONS" "$THRESHOLD_FUNCTIONS"
check_threshold "Branches" "$BRANCHES" "$THRESHOLD_BRANCHES"
