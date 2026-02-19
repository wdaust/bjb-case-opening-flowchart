#!/bin/bash
# Deploy script: pushes to main, verifies GitHub Pages workflow triggers, and reports status.
set -e

REPO="wdaust/bjb-case-opening-flowchart"

# Ensure we're on main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Error: not on main branch (on $BRANCH)"
  exit 1
fi

# Push
echo "Pushing to origin/main..."
git push origin main
COMMIT=$(git rev-parse --short HEAD)
echo "Pushed commit: $COMMIT"

# Wait for workflow to start (up to 30s)
echo "Waiting for deploy workflow to trigger..."
for i in {1..6}; do
  sleep 5
  RUN_SHA=$(gh api "repos/$REPO/actions/runs?per_page=1" --jq '.workflow_runs[0].head_sha' 2>/dev/null | head -c 7)
  if [ "$RUN_SHA" = "$COMMIT" ]; then
    echo "Workflow triggered for $COMMIT"
    break
  fi
  if [ "$i" -eq 6 ]; then
    echo "Workflow didn't auto-trigger. Dispatching manually..."
    gh workflow run pages.yml --repo "$REPO" --ref main
    sleep 3
  fi
done

# Wait for completion (up to 3 min)
echo "Waiting for deploy to complete..."
for i in {1..36}; do
  STATUS=$(gh api "repos/$REPO/actions/runs?per_page=1" --jq '.workflow_runs[0] | "\(.status) \(.conclusion // "")"' 2>/dev/null)
  if echo "$STATUS" | grep -q "completed success"; then
    echo ""
    echo "Deployed successfully!"
    echo "Live: https://wdaust.github.io/bjb-case-opening-flowchart/"
    exit 0
  elif echo "$STATUS" | grep -q "completed failure"; then
    echo ""
    echo "Deploy FAILED. Check: https://github.com/$REPO/actions"
    exit 1
  fi
  printf "."
  sleep 5
done

echo ""
echo "Timed out waiting. Check: https://github.com/$REPO/actions"
exit 1
