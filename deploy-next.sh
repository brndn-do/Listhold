#!/bin/bash

# --- PRE-FLIGHT CHECKS ---

# 1. Ensure current branch is 'develop'
if [[ $(git rev-parse --abbrev-ref HEAD) != "develop" ]]; then
  echo "Error: You must be on the 'develop' branch to run this script."
  exit 1
fi

# 2. Ensure working directory is clean
if ! git diff-index --quiet HEAD --; then
  echo "Error: Your working directory is not clean. Please commit or stash your changes."
  exit 1
fi

# 3. Fetch latest changes
echo "Fetching latest changes from remote..."
git fetch origin

# 4. Ensure 'develop' is up-to-date
if [[ $(git rev-parse HEAD) != $(git rev-parse origin/develop) ]]; then
  echo "Error: Your local 'develop' branch is not up-to-date. Please pull latest changes."
  exit 1
fi

# 5. Ensure build is sucessful
echo "Building the project..."
if ! npm run build; then
  echo "Error: Build failed. Fix the issues before proceeding."
  exit 1
fi

echo "Merging develop into main to trigger Vercel..."
git checkout main
git merge develop

echo "Pushing main branch to remote..."
git push origin main

# Switch back to develop
git checkout develop

echo "Frontend deployment complete. Vercel should now build production."
