"""
The Pulping Fish — generated server-side in Python.

This router renders the animated "pulp fish" as a sequence of ASCII-art
frames built from the word "pulp". The frontend fetches these frames once
and plays them back as the living background of the infinite canvas.

Keeping the fish logic in Python (rather than JS) is intentional: the
fish's shape, motion and "pulping" body-text are computed here.
"""
import math
from fastapi import APIRouter

router = APIRouter(tags=["fish"])

# A fish silhouette mask. '#' = body (filled with pulp text), ' ' = water.
FISH_MASK = [
    "                                              ###   ",
    "                    ####              ####   ####   ",
    "                #############      ###############  ",
    "             ###################  ##################",
    "          ##############################        ### ",
    "        ###################################         ",
    "      #######################################       ",
    "    ###   #####################################     ",
    "  ###       ###################################  ###",
    " ##    ##   ##################################  #### ",
    " ##   ###   ##################################  #####",
    " ##    ##   ##################################  #### ",
    "  ###       ###################################  ###",
    "    ###   #####################################     ",
    "      #######################################       ",
    "        ###################################         ",
    "          ##############################        ### ",
    "             ###################  ##################",
    "                #############      ###############  ",
    "                    ####              ####   ####   ",
    "                                              ###   ",
]

PULP = "pulp·"


def _render_frame(phase: int) -> str:
    """Fill the fish mask with flowing 'pulp' text, offset by `phase`
    so the body text appears to pulse/flow between frames."""
    out_rows = []
    wi = phase
    for row in FISH_MASK:
        line = []
        for ch in row:
            if ch == "#":
                c = PULP[wi % len(PULP)]
                line.append("·" if c == "·" else c)
                wi += 1
            else:
                line.append(" ")
                wi += 1
        out_rows.append("".join(line).rstrip())
    return "\n".join(out_rows)


@router.get("/fish/frames")
async def fish_frames(count: int = 12):
    """Return `count` animation frames of the pulping fish plus motion
    metadata (a sine path the frontend uses to drift the fish)."""
    count = max(2, min(count, 48))
    frames = [_render_frame(phase) for phase in range(count)]
    # Pre-compute a smooth vertical drift path (0..1 -> -1..1) for the swim.
    path = [round(math.sin(i / count * math.tau), 4) for i in range(count)]
    return {
        "frames": frames,
        "path": path,
        "width": max(len(r) for r in FISH_MASK),
        "height": len(FISH_MASK),
        "char_word": PULP,
    }


@router.get("/fish/ascii")
async def fish_ascii():
    """A single static frame — handy for the hero/logo contexts."""
    return {"art": _render_frame(0)}
