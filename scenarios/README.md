# Per-card scenarios

`record-gif.mjs` reads `scenarios/<card-id>.json` for a card before falling back
to its `--light` or default profile, and prints `scenario: scenarios/<id>.json`
when it does. Files here are how a hand-tuned clip survives `make gifs-all`.

Add one only for a page the generic profile records badly. Two reasons so far,
and they are different problems:

**The page does not scroll.** `aficion` is a canvas atlas exactly one viewport
tall, so every scroll step was a no-op and all 41 frames came out identical: a
1925 KB GIF of one still image. Its scenario clicks `#zoomIn` twice and opens the
Builds panel instead, which is 805 KB and an actual demo. The recorder now says
`every frame was identical` when this happens, so the next such card announces
itself rather than quietly shipping a still.

Four cards announced themselves that way on the 2026-09-18 re-record and three now
have a file: `headmap` toggles X-ray and walks the tabs (16 KB still to 493 KB,
21 of 58 frames distinct), `runcible` walks its `[data-ui]` tabs (10 KB to 161 KB),
and `proctor` starts a test and answers through the runner (16 KB to 461 KB). The
fourth, `skillmap`, is left as a still on purpose: it is archived, so the catalog
already argues against pointing anyone at it. A single-frame clip is not a bug in
the encoder, it is the page telling you the generic profile found nothing to show.

**Do not guess the selectors, probe them.** Every wrong guess costs a full record
and produces something that looks like progress. `proctor` took three tries because
its exam is two gates deep: the library is already the landing screen (so
`#loadTestBtn` only scrolls), a card's `Start` opens a mode chooser, and `#nextBtn`
lives inside `#view-runner`, which stays `[hidden]` until a mode is picked. Thirty
seconds of `page.evaluate` listing the visible buttons after each click answered
what two rounds of plausible-looking JSON could not. Use `:nth-match(sel, 1)` where
a selector matches several elements: `page.click` is strict and a multiple match is
a failure, not a first-match.

**The page is genuinely uncompressible.** `memes` is a wall of 99 *animated*
GIFs, so its frames never repeat however long the scenario holds: 27 of its 41
frames stay distinct across 22 held ones. It is the one card over the weight
budget (1296 KB against 1200) and it is accepted rather than fixed, because the
levers left all cost the thing the preview exists to show. Two attempts made it
worse: a shorter 28% travel came in at 1392 KB.

Note what no longer needs a file: holding still is not a tuning trick any more,
because `encode()` coalesces identical consecutive frames into one longer delay.
A held second is free everywhere now.

A step that cannot act prints `⚠ click <sel>: matched nothing within 3s` and the
run continues. It used to swallow the error, which is worse than it sounds: the
`every frame was identical` signal only fires when *nothing* moved, so a scenario
where one click of three lands recorded a partial demo at full weight and reported
success. That is exactly how `proctor` shipped its first two attempts.

Shape: `[{"hold":n}, {"scroll":{"to":"45%","frames":n}}, {"click":{"sel":"..."}},
{"hover":{"sel":"..."}}, {"type":{"sel":"...","text":"..."}}]`
