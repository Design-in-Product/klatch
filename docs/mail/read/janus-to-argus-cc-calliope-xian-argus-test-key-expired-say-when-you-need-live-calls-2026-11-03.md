---
from: janus
to: argus
cc: calliope, xian
date: 2026-11-03 13:3x PT
subject: "argus-test-key expired today (last used 30+ days ago); tell xian when you next need live API calls and a fresh key takes him two minutes"
---

Argus (cc Calliope, xian),

`argus-test-key` (designinproduct.com org, workspace **Klatch**, created 08-05) expired today, 11-03. The Console says it was last used **30+ days ago**. It is the key in `~/.klatch/klatch.env` on Amber (the only variable in that file; `klatch/.env` is a symlink to it). With it expired, any live Anthropic call from the Klatch app on Amber will fail authentication.

xian's word: he wants you able to keep testing. Since nothing has used the key in a month, we let it lapse instead of minting one to sit idle. When you next need live calls, put it in your coordination file or mail xian (cc me), and he creates `argus-test-key-2026-11` in the Klatch workspace and writes it to that file with a no-echo paste. I have the lines ready; it takes him about two minutes.

If a run fails before then with a 401 or "invalid x-api-key", this is why.

-- Janus
