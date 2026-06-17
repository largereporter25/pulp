#!/usr/bin/env python3
"""Create TEST poem, song, and prose documents on the live Pulp API."""
import json, secrets, urllib.request

API = "https://pulp-phi.vercel.app/api/documents"

def nid():
    return secrets.token_urlsafe(6)[:8]

def block(text):
    # Freeform docs store a single TextBlock in content.
    return [{"id": nid(), "text": text}]

# ----------------------------------------------------------------
# TEST POEM — centered serif verse; varied stanza shapes & lengths
# ----------------------------------------------------------------
POEM = """THE CARTOGRAPHER OF SMALL HOURS

I.

At 2 a.m. the city folds itself
into a single lit window —
mine.

I map the dark by what it keeps:
a kettle's slow forgetting,
the radiator's morse,
a moth rehearsing the same soft mistake
against the glass.

II.

Somewhere a printing press is breathing.
Somewhere a truth is being set in lead,
letter by stubborn letter,
and will not be unsaid.

III.

I have learned to love the unfinished —
the half-drawn coast,
the river that runs off the edge of the page
toward a sea I have not earned.

Tomorrow I will name these places.
Tonight I only keep them,
the way the small hours keep the light:
carefully,
and without asking why."""

# ----------------------------------------------------------------
# TEST SONG — full structure with [section] tags, verses, chorus,
# pre-chorus, bridge, outro, and a parenthetical backing line.
# ----------------------------------------------------------------
SONG = """PAPER & STATIC
Words & Music by Vansh Kunal Shah
Key: A minor  |  Tempo: 92 BPM

[Intro]
(soft piano, single held note)

[Verse 1]
I kept the receipts of every quiet war,
folded them small in the back of a drawer.
You said forget it, let the ashes settle down,
but I'm the kind that digs in the burned-out ground.

[Pre-Chorus]
And every wire hums a warning,
every screen goes dark on cue —

[Chorus]
But you can't corrupt the paper,
you can't delete the ink.
You can buy the loudest speaker,
you can't unteach me how to think.
Burn the cloud, I've got the carbon,
keep your static, I've got the proof —
paper and static,
me and the truth.

[Verse 2]
They sent a friend in capital letters to my door,
said the story's getting heavy, what's it for?
I traded sleep for certainty, that's the deal,
you can fake a voice but you can't fake what's real.

[Pre-Chorus]
And every wire hums a warning,
every shadow learns my name —

[Chorus]
But you can't corrupt the paper,
you can't delete the ink.
You can buy the loudest speaker,
you can't unteach me how to think.
Burn the cloud, I've got the carbon,
keep your static, I've got the proof —
paper and static,
me and the truth.

[Bridge]
(drums drop out, voice bare)
I am the footnote you forgot to bury,
the second source, the long way home.
I am the box you couldn't carry,
the one small light that won't leave me alone.

[Final Chorus]
So you can't corrupt the paper —
(you can't, you can't)
you can't delete the ink —
(no, no)
keep your static, I've got the proof,
paper and static,
me and the truth.

[Outro]
(piano returns, fades)
Me and the truth.
Me and the truth."""

# ----------------------------------------------------------------
# TEST PROSE — short story; paragraphs, a scene break, dialogue,
# em-dashes, and varied paragraph rhythm.
# ----------------------------------------------------------------
PROSE = """THE BOX

The taxi smelled of rain and other people's cigarettes, and Maya held the cardboard box on her lap the way you hold something that might be alive. Forty pounds of paper. A decade of somebody else's careful lies, kept honest by the one man brave enough — or frightened enough — to write them down.

She had not slept in two days, and the city slid past the window in long wet smears of neon, each light a sentence she hadn't finished writing. Somewhere behind her, she was almost certain, a black car kept a respectful distance. She had stopped checking. Checking only fed the part of her that wanted to be afraid, and that part had eaten enough this week.

When the cab stopped, the driver caught her eye in the mirror.

"Long night?" he said.

"Long year," she answered, and gave him too much money, because she wasn't sure she'd get another chance to be generous.

*          *          *

Derek was waiting at the loading dock, holding the door open with his foot, his collar turned up against a wind that couldn't decide if it was rain or just the threat of it. He looked at the box, then at her, and something in his face did the math and didn't like the total.

"Tell me you have the audio," he said.

"They killed the audio." She set the box on a dolly and leaned on it, suddenly exhausted in a way that had nothing to do with sleep. "We go with the ledgers. Photographed. Notarized. Three copies, three cities. They can corrupt a file, Derek. They can't corrupt a box."

He was quiet for a moment. Rain ticked against the corrugated roof like a clock that had given up on time.

"You know what happens when we publish," he said. It wasn't a question.

"Yeah." She almost smiled. "Something true happens. For once, on purpose."

He held the door wider. She wheeled the box inside, into the warm hum of the building, into the last few hours before the world would be a slightly different shape — and neither of them, not yet, knew which way it would break.

But the paper knew. The paper had known all along.

— THE END —"""

docs = [
    {"title": "TEST", "mode": "poem", "content": block(POEM)},
    {"title": "TEST", "mode": "song", "content": block(SONG)},
    {"title": "TEST", "mode": "prose", "content": block(PROSE)},
]

for d in docs:
    body = json.dumps(d).encode()
    req = urllib.request.Request(API, data=body, headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        resp = json.loads(r.read())
        wc = len(d["content"][0]["text"].split())
        print(f"Saved {d['mode']:6s} | id={resp['id']} | words={wc} | status={r.status}")
