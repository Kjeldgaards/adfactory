#!/bin/bash
# ============================================================
# adfactory push helper
# ============================================================
# Usage:
#   ./scripts/push.sh "commit message"
#   GITHUB_TOKEN=ghp_xxx ./scripts/push.sh "commit message"
#
# Reads token from (in order):
#   1. GITHUB_TOKEN environment variable
#   2. ~/.adfactory-token file
# ============================================================

set -e
cd "$(dirname "$0")/.."

# 1. Find token
if [ -z "$GITHUB_TOKEN" ]; then
  if [ -f ~/.adfactory-token ]; then
    GITHUB_TOKEN=$(cat ~/.adfactory-token | tr -d '\n\r ')
  else
    echo "❌ No token found."
    echo "   Set GITHUB_TOKEN env var, or save token to ~/.adfactory-token"
    exit 1
  fi
fi

# 2. Validate token format
if [[ ! "$GITHUB_TOKEN" =~ ^ghp_[A-Za-z0-9]{36}$ ]]; then
  echo "❌ Token format invalid (should start with ghp_ and be 40 chars total)"
  exit 1
fi

# 3. Test token BEFORE push (fail-fast)
echo "🔍 Testing token..."
AUTH=$(echo -n "Kjeldgaards:$GITHUB_TOKEN" | base64 -w 0 2>/dev/null || echo -n "Kjeldgaards:$GITHUB_TOKEN" | base64)
TEST=$(curl -sS -o /dev/null -w "%{http_code}" \
  -H "Authorization: Basic $AUTH" \
  "https://github.com/Kjeldgaards/adfactory.git/info/refs?service=git-receive-pack")

if [ "$TEST" != "200" ]; then
  echo "❌ Token rejected by GitHub (HTTP $TEST)"
  echo "   Token is revoked or has wrong scopes."
  echo "   Generate new token at: https://github.com/settings/tokens"
  echo "   Required scope: repo (full)"
  exit 1
fi
echo "✅ Token valid"

# 4. Stage and commit if there are changes
if [ -n "$(git status --porcelain)" ]; then
  COMMIT_MSG="${1:-Update files}"
  git add -A
  git -c user.email="thomas@kjeldgaard.dk" -c user.name="Thomas Kjeldgaard" \
    commit -m "$COMMIT_MSG"
  echo "✅ Committed: $COMMIT_MSG"
else
  echo "ℹ️  No changes to commit (will push existing commits)"
fi

# 5. Push using ASKPASS (works in sandboxes that block @-URLs)
ASKPASS=$(mktemp)
cat > "$ASKPASS" << EOF
#!/bin/bash
case "\$1" in
  Username*) echo "Kjeldgaards" ;;
  Password*) echo "$GITHUB_TOKEN" ;;
esac
EOF
chmod +x "$ASKPASS"

# Reset remote to clean URL (no embedded credentials)
git remote set-url origin https://github.com/Kjeldgaards/adfactory.git

# Push
GIT_ASKPASS="$ASKPASS" git -c credential.helper= push origin main 2>&1
RESULT=$?

rm -f "$ASKPASS"

if [ $RESULT -eq 0 ]; then
  echo ""
  echo "✅ Push complete"
  echo "   Commit: $(git rev-parse --short HEAD)"
  echo "   Live in ~60 sec on Railway"
else
  echo "❌ Push failed"
  exit 1
fi
