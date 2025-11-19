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

# 3. Fetch latest changes from remote
echo "Fetching latest changes from remote..."
git fetch origin

# 4. Ensure 'develop' is up-to-date with its remote counterpart
if [[ $(git rev-parse HEAD) != $(git rev-parse origin/develop) ]]; then
  echo "Error: Your local 'develop' branch is not up-to-date with 'origin/develop'. Please pull latest changes."
  exit 1
fi

# 5. Ensure 'main' is up-to-date
if [[ $(git rev-parse main) != $(git rev-parse origin/main) ]]; then
   echo "Error: Your local 'main' branch is not up-to-date with 'origin/main'. Please update it (e.g., git checkout main && git pull && git checkout develop)."
   exit 1
fi

# 6. Check for potential merge conflicts *before* deploying
# Perform a dry-run merge to detect conflicts early
echo "Performing dry-run merge to check for conflicts..."
if ! git merge --no-commit --no-ff develop &> /dev/null; then # Merge to current HEAD (develop for dry run)
    echo "Error: Merge conflicts detected! Please resolve them manually before deploying."
    git merge --abort # Abort the dry-run merge
    exit 1
fi
# If no conflicts, abort the dry-run merge to leave the branch clean
git merge --abort &> /dev/null
echo "No merge conflicts found. Proceeding with deployment."


# --- DEPLOYMENT AND MERGE ---

echo "All pre-flight checks passed. Starting deployment to production..."

# Deploy to production Firebase project
firebase use prod && \
firebase deploy && \
echo "Deployment successful. Merging develop into main..." && \

# Merge develop into main and push
git checkout main && \
git merge develop && \
git push origin main && \
echo "Successfully merged and pushed to main." && \

# Switch back to develop branch and dev Firebase environment
git checkout develop && \
firebase use dev && \
echo "Switched back to develop branch and dev environment. Release complete!"
