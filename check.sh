#!/usr/bin/env bash
# The repo's laws, checkable. Run before committing; CI runs it on push.
set -euo pipefail
cd "$(dirname "$0")"
fail=0

# 1. Build drift: committed outputs must be reproducible from src/.
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
OUT_ROOT="$tmp" bash build.sh >/dev/null
for f in artifact/index.html artifact/press.html index.html press/index.html; do
  if ! diff -q "$tmp/$f" "$f" >/dev/null 2>&1; then
    echo "FAIL: $f drifts from src/ (rebuild and commit, or fix src/)"
    fail=1
  fi
done

# 2. Source ceiling: no src file over 300 lines (split at the next natural boundary).
while IFS= read -r f; do
  n=$(wc -l < "$f")
  if [ "$n" -gt 300 ]; then
    echo "FAIL: $f is $n lines (ceiling 300)"
    fail=1
  fi
done < <(find src -type f)

# 3. The external-request law: shipped pages make zero requests to any host.
hits=$(grep -RlnE 'src="http|href="http|url\(http|@import' src/ || true)
if [ -n "$hits" ]; then
  echo "FAIL: external reference in src/:"
  echo "$hits"
  fail=1
fi

# 4. Badge honesty: the page-weight claim in the footer matches reality.
actual_kb=$(( $(wc -c < artifact/index.html) / 1024 ))
claimed_kb=$(grep -o '[0-9]* KB' src/footer.html | head -1 | grep -o '[0-9]*')
delta=$(( actual_kb - claimed_kb ))
if [ "${delta#-}" -gt 3 ]; then
  echo "FAIL: footer claims ${claimed_kb} KB, artifact is ${actual_kb} KB"
  fail=1
fi

# 5. Weight budget: warn when the app fragment crosses 64 KB.
if [ "$(wc -c < artifact/index.html)" -gt 65536 ]; then
  echo "WARN: app fragment over 64 KB; the pamphlet is getting heavy"
fi

# 6. Licenses present (charter III.4).
if [ ! -f LICENSE ] || [ ! -f LICENSE-docs ]; then
  echo "FAIL: LICENSE or LICENSE-docs missing"
  fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "check: all laws hold"
fi
exit "$fail"
