#!/bin/sh
# census.sh -- unit-475schemasource
#
# Reproduces the grep passes this unit ran against
# packages/server/src/__tests__ to find candidate schema-fact assertions.
# Every hit below was then hand-read; RESULTS.md records which were
# confirmed, which were rejected (named), and which were left undriven
# (named). This script finds candidates -- it does not classify them.
set -eu
cd "$(dirname "$0")/../../.."
TESTS=packages/server/src/__tests__

echo "== total server test files =="
find "$TESTS" -maxdepth 1 -name "*.test.ts" | wc -l

echo
echo "== pass 1: schema introspection (table_info / PRAGMA) =="
grep -rlE "table_info|PRAGMA" "$TESTS" --include="*.test.ts" | sort

echo
echo "== pass 2: DB-level constraint violation text =="
grep -rlE "UNIQUE constraint|CHECK constraint|FOREIGN KEY constraint|NOT NULL constraint" \
  "$TESTS" --include="*.test.ts" | sort

echo
echo "== pass 3: direct applySchema import/call =="
grep -rl "applySchema" "$TESTS" --include="*.test.ts" | sort

echo
echo "== pass 4: filename/describe/it keyword scan (schema|migrat|constraint|ddl) =="
grep -rliE "describe\(.*(schema|migrat|constraint|ddl)|it\(.*(schema|migrat|constraint)" \
  "$TESTS" --include="*.test.ts" | sort

echo
echo "== pass 5: broad field-name default-assertion scan (NOT hand-confirmed; see RESULTS.md 'Not driven') =="
grep -rlE "expect\([^)]*\.(type|effort|mode|isDefault|is_default|reflections|refType|ref_type)\)\.to(Be|Equal)\(" \
  "$TESTS" --include="*.test.ts" | sort
