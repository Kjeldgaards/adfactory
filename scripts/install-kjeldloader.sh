#!/bin/bash
# KJELDGAARD Loader — installer
# Adds the `kjeldloader` command to your shell.
# After install, run `kjeldloader` anywhere to copy the project loader to clipboard.

set -e

ZSHRC="$HOME/.zshrc"
MARKER="# === KJELDGAARD_LOADER_START ==="
END_MARKER="# === KJELDGAARD_LOADER_END ==="

FUNCTION_BLOCK=$(cat <<'EOF'
# === KJELDGAARD_LOADER_START ===
# Fetches the KJELDGAARD project loader from Railway and copies it to clipboard.
# Paste into any new Claude project's Custom Instructions field.
kjeldloader() {
  local url="https://adfactory-production.up.railway.app/api/docs/KJELDGAARD_PROJECT_LOADER.md"
  local content
  content=$(curl -sS --fail "$url" 2>/dev/null) || {
    echo "❌ Could not fetch loader from Railway. Check your internet connection."
    return 1
  }

  # Extract only the loader block (everything after the "---" separator line after "copy everything below the line")
  # Strip the markdown header section, keep just the instruction block
  local loader_text
  loader_text=$(echo "$content" | awk '/^You are working on KJELDGAARD/,/^\(End of loader block\)/' | sed '/^(End of loader block)/d')

  if [ -z "$loader_text" ]; then
    echo "❌ Loader file fetched but content format unexpected. Copying full file instead."
    loader_text="$content"
  fi

  echo "$loader_text" | pbcopy
  local line_count
  line_count=$(echo "$loader_text" | wc -l | tr -d ' ')
  echo "✅ KJELDGAARD loader copied to clipboard ($line_count lines)"
  echo "   Now paste it into your Claude project's Custom Instructions field."
}
# === KJELDGAARD_LOADER_END ===
EOF
)

# Remove any previous version
if grep -q "$MARKER" "$ZSHRC" 2>/dev/null; then
  echo "Removing existing kjeldloader function..."
  # Use sed to delete lines between markers (inclusive)
  sed -i.bak "/$MARKER/,/$END_MARKER/d" "$ZSHRC"
  rm -f "$ZSHRC.bak"
fi

# Append fresh version
echo "" >> "$ZSHRC"
echo "$FUNCTION_BLOCK" >> "$ZSHRC"

echo ""
echo "✅ Installed kjeldloader to $ZSHRC"
echo ""
echo "To activate in your CURRENT terminal, run:"
echo "    source ~/.zshrc"
echo ""
echo "Or just open a new terminal tab."
echo ""
echo "Then anywhere, run:"
echo "    kjeldloader"
echo ""
echo "The loader will be copied to your clipboard, ready to paste into a Claude project."
