#!/bin/sh
# Drive 8: the same gate as drive 7, but with the exit code captured rather than
# inferred from the presence of a summary line. A `&&` chain that printed its
# last success line has almost certainly exited 0 — "almost certainly" is not a
# measurement, and this seat has a filed lesson about exactly that.
cd "$(dirname "$0")/../../.." || exit 9
npm test
rc=$?
echo "npm test exit=$rc"
exit "$rc"
