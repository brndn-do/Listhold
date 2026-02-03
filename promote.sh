#!/bin/bash

# promote.sh - Merges develop into main ONLY if CI passed

set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
    echo "Error: GitHub CLI (gh) is not installed."
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "Error: GitHub CLI is not authenticated."
    exit 1
fi

# Ensure we are on the develop branch to prevent accidental deployment confusion
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "Error: You must be on the 'develop' branch to run this script."
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo " Error: You have uncommitted changes."
    echo " Please commit or stash them before running this script."
    exit 1
fi

# Verify develop is synced with remote
git fetch origin develop
LOCAL_HASH=$(git rev-parse develop)
REMOTE_HASH=$(git rev-parse origin/develop)

if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
    echo "Error: Your local 'develop' is not in sync with 'origin/develop'."
    echo "Please push your changes (or pull remote changes) before promoting."
    exit 1
fi

# Verify main is clean (ensure we don't accidentally ship unpushed local commits on main)
# We only check if local 'main' exists
if git show-ref --verify --quiet refs/heads/main; then
    # Count commits where local main is ahead of origin/main
    MAIN_AHEAD=$(git rev-list --count origin/main..main)
    
    if [ "$MAIN_AHEAD" -gt 0 ]; then
        echo "Error: Your local 'main' branch is ahead of 'origin/main' by $MAIN_AHEAD commits."
        echo "This implies you have local changes on 'main' that are not in production."
        echo "Please push or reset your local 'main' branch before running this script."
        exit 1
    fi
fi

echo "Checking GitHub Actions status for 'develop'..."

# Get the status of the latest run on develop using GitHub CLI
# --jq '.[0].conclusion' extracts the status string (success, failure, null)
STATUS=$(gh run list --branch develop --event push --limit 1 --json conclusion --jq '.[0].conclusion')

if [ "$STATUS" == "success" ]; then
    echo "CI Passed on develop. Promoting to production..."
else
    echo "Stop: Latest CI status on develop is: '${STATUS:-running/unknown}'"
    echo "Wait for it to finish or fix the errors."
    exit 1
fi

# Execution: Checkout Main -> Merge -> Push -> Return
CURRENT_BRANCH=$(git branch --show-current)

# Fetch latest refs to be sure
git fetch origin

# Switch to main
git checkout main
git pull origin main

# Merge origin/develop (Merging remote guarantees we merge exactly what was tested)
git merge origin/develop -m "chore: promote develop to main"

# Push
git push origin main

# Return to where we started
git checkout "$CURRENT_BRANCH"

echo "Successfully promoted to main!"