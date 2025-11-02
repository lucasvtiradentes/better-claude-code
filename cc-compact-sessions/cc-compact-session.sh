#!/bin/bash

CLAUDE_DIR="$HOME/.claude"
CLAUDE_BIN="$HOME/.claude/local/claude"

MODE="$1"
SESSION_ID_OR_FILE="$2"

if [ -z "$MODE" ] || [ -z "$SESSION_ID_OR_FILE" ]; then
  echo "Usage:"
  echo "  $0 --parse <session-id>           Parse JSONL to markdown"
  echo "  $0 --compact <parsed-md-file>     Compact parsed markdown via CC"
  echo ""
  echo "Examples:"
  echo "  $0 --parse 1a63d49a-ca65-4872-a5fb-9cbc8a4d6f49"
  echo "  $0 --compact cc-session-parsed-1a63d49a-ca6.md"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo "jq is required but not installed. Install it with: sudo apt install jq"
  exit 1
fi

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: This script only works inside a git repository"
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
PROJECT_DIR="$CLAUDE_DIR/projects/$(echo "$REPO_ROOT" | sed 's|/_|--|g; s|/|-|g')"

parse_assistant_message() {
  local json="$1"
  echo "$json" | jq -r '
    if type == "array" then
      .[] |
      if .type == "text" then
        .text
      elif .type == "tool_use" then
        if .name == "Bash" then
          "[tool: Bash] " + (.input.command // .input.description // "")
        elif .name == "Read" then
          "[tool: Read] " + (.input.file_path // "")
        elif .name == "Edit" then
          "[tool: Edit] " + (.input.file_path // "")
        elif .name == "Write" then
          "[tool: Write] " + (.input.file_path // "")
        elif .name == "Grep" then
          "[tool: Grep] " + (.input.pattern // "")
        elif .name == "Glob" then
          "[tool: Glob] " + (.input.pattern // "")
        else
          "[tool: \(.name)]"
        end
      else
        ""
      end
    else
      .
    end
  ' 2>/dev/null || echo "$json"
}

parse_user_message() {
  local json="$1"
  if echo "$json" | jq -e 'type == "array" and .[0].type == "tool_result"' >/dev/null 2>&1; then
    return 1
  else
    echo "$json" | jq -r '.' 2>/dev/null || echo "$json"
  fi
}

if [ "$MODE" = "--parse" ]; then
  SESSION_ID="$SESSION_ID_OR_FILE"
  SESSION_FILE="$PROJECT_DIR/$SESSION_ID.jsonl"

  if [ ! -f "$SESSION_FILE" ]; then
    echo "Session file not found: $SESSION_FILE"
    exit 1
  fi

  OUTPUT_FILE="$REPO_ROOT/cc-session-parsed-${SESSION_ID:0:12}.md"

  echo "Parsing session $SESSION_ID..."

  > "$OUTPUT_FILE"

  first_user=true
  first_assistant=true

  temp_files=$(mktemp)
  temp_urls=$(mktemp)
  trap "rm -f $temp_files $temp_urls" EXIT

  temp_middle=$(mktemp)
  trap "rm -f $temp_files $temp_urls $temp_middle" EXIT

  jq -c 'select(.type == "user" or .type == "assistant") | {type: .type, content: .message.content, ts: .timestamp}' "$SESSION_FILE" | \
  while IFS= read -r line; do
    msg_type=$(echo "$line" | jq -r '.type')
    content_raw=$(echo "$line" | jq -c '.content')

    if [ "$msg_type" = "user" ]; then
      content=$(parse_user_message "$content_raw")
      if [ $? -ne 0 ]; then
        continue
      fi

      if [ "$first_user" = true ]; then
        echo "<user_message type=\"initial\">" >> "$OUTPUT_FILE"
        echo "$content" >> "$OUTPUT_FILE"
        echo "</user_message>" >> "$OUTPUT_FILE"
        first_user=false
      else
        encoded=$(echo "$content" | base64 -w0)
        echo "user|$encoded" >> "$temp_middle"
      fi
    else
      content=$(parse_assistant_message "$content_raw")

      if [ "$first_assistant" = true ]; then
        echo "<cc_message type=\"initial\">" >> "$OUTPUT_FILE"
        echo "$content" >> "$OUTPUT_FILE"
        echo "</cc_message>" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "----" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        first_assistant=false
      else
        encoded=$(echo "$content" | base64 -w0)
        echo "assistant|$encoded" >> "$temp_middle"
      fi
    fi
  done

  total_middle=$(wc -l < "$temp_middle")

  if [ "$total_middle" -gt 2 ]; then
    prev_type=""
    buffer=""

    head -n -2 "$temp_middle" | while IFS='|' read -r msg_type encoded; do
      content=$(echo "$encoded" | base64 -d)
      trimmed=$(echo "$content" | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

      if [ -z "$trimmed" ]; then
        continue
      fi

      if [ "$prev_type" = "" ]; then
        prev_type="$msg_type"
        buffer="$content"
      elif [ "$prev_type" = "$msg_type" ]; then
        buffer="$buffer"$'\n'"$content"
      else
        if [ "$prev_type" = "user" ]; then
          echo "<user_message>$buffer</user_message>" >> "$OUTPUT_FILE"
        else
          echo "<cc_message>$buffer</cc_message>" >> "$OUTPUT_FILE"
        fi
        echo "" >> "$OUTPUT_FILE"
        prev_type="$msg_type"
        buffer="$content"
      fi
    done

    if [ -n "$buffer" ]; then
      if [ "$prev_type" = "user" ]; then
        echo "<user_message>$buffer</user_message>" >> "$OUTPUT_FILE"
      else
        echo "<cc_message>$buffer</cc_message>" >> "$OUTPUT_FILE"
      fi
      echo "" >> "$OUTPUT_FILE"
    fi

    echo "----" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi

  last_user_encoded=$(grep '^user|' "$temp_middle" | tail -1 | cut -d'|' -f2-)
  last_assistant_encoded=$(grep '^assistant|' "$temp_middle" | tail -1 | cut -d'|' -f2-)

  last_user_content=$(echo "$last_user_encoded" | base64 -d)
  last_assistant_content=$(echo "$last_assistant_encoded" | base64 -d)

  if [ -n "$last_user_content" ]; then
    echo "<user_message type=\"final\">" >> "$OUTPUT_FILE"
    echo "$last_user_content" >> "$OUTPUT_FILE"
    echo "</user_message>" >> "$OUTPUT_FILE"
  fi

  if [ -n "$last_assistant_content" ]; then
    echo "<cc_message type=\"final\">" >> "$OUTPUT_FILE"
    echo "$last_assistant_content" >> "$OUTPUT_FILE"
    echo "</cc_message>" >> "$OUTPUT_FILE"
  fi

  echo "" >> "$OUTPUT_FILE"
  echo "----" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "related info:" >> "$OUTPUT_FILE"

  {
    grep -oE '(/[a-zA-Z0-9/_.-]+\.(ts|js|tsx|jsx|json|md|sh|yaml|yml|env|sql|txt)|[a-zA-Z0-9_.-]+/[a-zA-Z0-9/_.-]+\.(ts|js|tsx|jsx|json|md|sh|yaml|yml|env|sql|txt))' "$SESSION_FILE" | while IFS= read -r file; do
      if [[ "$file" == *"@"* ]] || [[ "$file" == *"\\"* ]]; then
        continue
      fi

      if [[ "$file" =~ ^/[a-z]/[a-z]+ ]] || [[ "$file" =~ /[a-z]/[a-z]+/ ]]; then
        continue
      fi

      normalized=""
      if [[ "$file" == "$REPO_ROOT"* ]]; then
        normalized="$file"
      elif [[ "$file" == /home/* ]]; then
        normalized="$file"
      elif [[ "$file" == /* ]]; then
        if [[ "$file" == /api/* ]] || [[ "$file" == /dashboard/* ]] || [[ "$file" == /types/* ]] || [[ "$file" == /src/* ]] || [[ "$file" == /.ignore/* ]]; then
          normalized="$REPO_ROOT$file"
        else
          normalized="$file"
        fi
      else
        normalized="$REPO_ROOT/$file"
      fi

      if [[ "$normalized" =~ $REPO_ROOT/[a-z]/[a-z] ]]; then
        continue
      fi

      echo "$normalized"
    done
  } | sort | uniq > "$temp_files"

  {
    grep -oE 'https?://[a-zA-Z0-9./?=_%:-]*' "$SESSION_FILE" | sort | uniq
  } > "$temp_urls"

  if [ -s "$temp_files" ]; then
    echo " - files:" >> "$OUTPUT_FILE"
    while IFS= read -r file; do
      echo "   - $file" >> "$OUTPUT_FILE"
    done < "$temp_files"
  fi

  if [ -s "$temp_urls" ]; then
    echo " - urls:" >> "$OUTPUT_FILE"
    while IFS= read -r url; do
      echo "   - $url" >> "$OUTPUT_FILE"
    done < "$temp_urls"
  fi

  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  SCRIPT_PATH="$SCRIPT_DIR/$(basename "$0")"

  echo ""
  echo "✓ Parsed session to: $OUTPUT_FILE"
  echo ""
  echo "Next step:"
  echo "  $SCRIPT_PATH --compact $(basename "$OUTPUT_FILE")"
  echo ""

elif [ "$MODE" = "--compact" ]; then
  PARSED_FILE="$SESSION_ID_OR_FILE"

  if [[ "$PARSED_FILE" != /* ]]; then
    PARSED_FILE="$REPO_ROOT/$PARSED_FILE"
  fi

  if [ ! -f "$PARSED_FILE" ]; then
    echo "Parsed file not found: $PARSED_FILE"
    exit 1
  fi

  if [ ! -x "$CLAUDE_BIN" ]; then
    echo "Claude Code binary not found or not executable: $CLAUDE_BIN"
    exit 1
  fi

  SHORT_ID=$(basename "$PARSED_FILE" .md | sed 's/cc-session-parsed-//')
  OUTPUT_FILE="$REPO_ROOT/cc-session-summary-${SHORT_ID}.md"
  CLEANUP_UUID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid)

  echo "Compacting session via Claude Code..."
  echo ""

  PROMPT="CLAUDE_CODE_SESSION_COMPACTION_ID: $CLEANUP_UUID

You are analyzing a parsed Claude Code session to extract important information.

Read the file: @$(basename "$PARSED_FILE")

Based on the content, generate a structured markdown summary with these sections:

# Session Summary

## Overview
Brief 2-3 sentence description of what the conversation was about

## Important Files and Folders
List absolute paths to files/folders that are critical to understand this work:
- /absolute/path/to/file1.ts
- /absolute/path/to/folder/

## Todo List
Extract what was accomplished and what remains:
- [x] Completed task 1
- [x] Completed task 2
- [ ] Pending task 1
- [ ] Pending task 2

## Notes
Document complexities, non-trivial issues, architectural decisions, blockers:
- Complex issue: explanation
- Technical consideration: important decision
- Blocker: unresolved dependency

## Initial and Final Messages

### Initial Request
\`\`\`
[paste first user message]
\`\`\`

### Initial Response
\`\`\`
[paste first CC response - truncate if very long]
\`\`\`

### Final Request
\`\`\`
[paste last user message]
\`\`\`

### Final Response
\`\`\`
[paste last CC response - truncate if very long]
\`\`\`

IMPORTANT:
1. Use the Write tool to save the complete markdown summary to: $OUTPUT_FILE
2. Do NOT output the summary as text - only use Write tool
3. After saving, confirm with: \"✓ Summary saved to: $OUTPUT_FILE\""

  "$CLAUDE_BIN" --dangerously-skip-permissions -p "$PROMPT"

  if [ ! -f "$OUTPUT_FILE" ]; then
    echo ""
    echo "Error: Summary file was not created at $OUTPUT_FILE"
    exit 1
  fi

  echo ""
  echo "✓ Summary created: $OUTPUT_FILE"
  echo ""
  echo "Cleaning up compaction sessions..."

  session_to_delete=$(grep -l "CLAUDE_CODE_SESSION_COMPACTION_ID: $CLEANUP_UUID" "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1)

  if [ -n "$session_to_delete" ]; then
    session_id=$(basename "$session_to_delete" .jsonl)
    echo "  Deleting compaction session: $session_id"
    rm -f "$session_to_delete"
  else
    echo "  No compaction session found to delete"
  fi

  echo ""
  echo "Compaction complete!"
  echo ""

else
  echo "Invalid mode: $MODE"
  echo "Use --parse or --compact"
  exit 1
fi
