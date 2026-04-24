#!/bin/bash
# KJELDGAARD Loader — installer
# Adds two commands to your shell:
#   kjeldgaard              — generic copywriting/ads loader
#   kjeldgaard-strategist   — DTC creative strategist + performance analyst loader
# After install, run either command anywhere to copy the matching loader to clipboard.

set -e

ZSHRC="$HOME/.zshrc"
MARKER="# === KJELDGAARD_LOADER_START ==="
END_MARKER="# === KJELDGAARD_LOADER_END ==="

FUNCTION_BLOCK=$(cat <<'EOF'
# === KJELDGAARD_LOADER_START ===
# Shared helper — fetches a loader file from Railway and copies the loader block to clipboard.
_kjeldgaard_fetch_and_copy() {
  local filename="$1"
  local label="$2"
  local url="https://raw.githubusercontent.com/Kjeldgaards/adfactory/main/docs/$filename?cachebust=$(date +%s)"
  local content
  content=$(curl -sS --fail "$url" 2>/dev/null) || {
    echo "❌ Could not fetch $filename from GitHub. Check your internet connection."
    return 1
  }

  # Extract only the loader block (from "You are..." line down to "(End of loader block)")
  local loader_text
  loader_text=$(echo "$content" | awk '/^You are /,/^\(End of loader block\)/' | sed '/^(End of loader block)/d')

  if [ -z "$loader_text" ]; then
    echo "⚠️  Loader block not found in expected format — copying full file instead."
    loader_text="$content"
  fi

  echo "$loader_text" | pbcopy
  local line_count
  line_count=$(echo "$loader_text" | wc -l | tr -d ' ')
  echo "✅ $label loader copied to clipboard ($line_count lines)"
  echo "   Now paste it into your Claude project's Custom Instructions field."
}

# Generic copywriting/ads loader
kjeldgaard() {
  _kjeldgaard_fetch_and_copy "KJELDGAARD_PROJECT_LOADER.md" "KJELDGAARD"
}

# Strategist / performance analyst loader
kjeldgaard-strategist() {
  _kjeldgaard_fetch_and_copy "KJELDGAARD_PROJECT_LOADER_STRATEGIST.md" "KJELDGAARD Strategist"
}
# === KJELDGAARD_LOADER_END ===
EOF
)

# Remove any previous version (macOS-compatible)
if grep -q "$MARKER" "$ZSHRC" 2>/dev/null; then
  echo "Removing existing kjeldgaard functions..."
  # Use a temp file approach that works on both macOS and Linux
  awk -v start="$MARKER" -v end="$END_MARKER" '
    $0 ~ start {skip=1; next}
    $0 ~ end {skip=0; next}
    !skip {print}
  ' "$ZSHRC" > "$ZSHRC.tmp" && mv "$ZSHRC.tmp" "$ZSHRC"
fi

# Append fresh version
echo "" >> "$ZSHRC"
echo "$FUNCTION_BLOCK" >> "$ZSHRC"

echo ""
echo "✅ Installed kjeldgaard commands to $ZSHRC"
echo ""
echo "To activate in your CURRENT terminal, run:"
echo "    source ~/.zshrc"
echo ""
echo "Or just open a new terminal tab."
echo ""
echo "Available commands:"
echo "    kjeldgaard              — generic copywriting / ads loader"
echo "    kjeldgaard-strategist   — DTC strategist / performance analyst loader"
echo ""
echo "Run either anywhere — the loader text is copied to your clipboard,"
echo "ready to paste into a Claude project's Custom Instructions."
