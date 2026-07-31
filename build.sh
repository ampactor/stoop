#!/usr/bin/env bash
# Assemble shipped artifacts from src/. The SQLite rule: develop as parts,
# ship as one file. Outputs are generated; edit src/, never the outputs.
#
#   artifact/index.html  app fragment (no doctype; the claude.ai publisher wraps it)
#   artifact/press.html  press fragment (same shape)
#   index.html           full document for GitHub Pages and local opening
#   press/index.html     full document, same treatment
#
# OUT_ROOT overrides the output prefix (check.sh builds to a temp dir).
set -euo pipefail
cd "$(dirname "$0")"
export LC_ALL=C
OUT_ROOT="${OUT_ROOT:-.}"

emit_app_fragment() {
  cat src/meta.html
  printf '<style>\n'
  cat src/base.css src/rooms.css src/views.css
  printf '</style>\n\n'
  cat src/defs.html
  printf '\n'
  cat src/chrome.html
  printf '\n<main>\n\n'
  cat src/views/*.html
  printf '</main>\n'
  cat src/footer.html
  printf '<script>\n'
  cat src/app.js
  printf '</script>\n'
}

wrap_doc() { # $1 fragment-file  $2 description  $3 out-file
  local title_line
  title_line=$(grep -m1 '^<title>' "$1")
  {
    printf '<!doctype html>\n<html lang="en">\n<head>\n'
    printf '<meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
    printf '<meta name="description" content="%s">\n' "$2"
    printf '%s\n' "$title_line"
    printf '</head>\n<body>\n'
    sed '0,/^<title>/{/^<title>/d;}' "$1"
    printf '</body>\n</html>\n'
  } > "$3"
}

mkdir -p "$OUT_ROOT/artifact" "$OUT_ROOT/press"

emit_app_fragment > "$OUT_ROOT/artifact/index.html"
cp src/press.html "$OUT_ROOT/artifact/press.html"

wrap_doc "$OUT_ROOT/artifact/index.html" \
  "Folk media at scene scale: rooms, scenes, zines, flyers, the rounds, and the law. A model town lives here until real scenes move in." \
  "$OUT_ROOT/index.html"

wrap_doc "$OUT_ROOT/artifact/press.html" \
  "Print-and-fold kit for a first zine: one letter sheet, eight pages, one cut." \
  "$OUT_ROOT/press/index.html"

echo "built: artifact/index.html artifact/press.html index.html press/index.html (root: $OUT_ROOT)"
