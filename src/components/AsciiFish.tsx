import { useMemo } from "react";

/**
 * A fish silhouette rendered as text — built from the repeated word
 * "pulp", echoing pulp.to's hero artwork. The mask defines the shape;
 * characters fill it, spaces leave the red background showing.
 */
const MASK = [
  "                                        ##  ",
  "                  ####            ####  ##  ",
  "              ###########      #########    ",
  "           ################  ###############",
  "         ###########################     ###",
  "       ################################      ",
  "     #####################################   ",
  "   ###  #####################################",
  "  ##      ###################################",
  " ##   ##  ###################################",
  "  ##      ###################################",
  "   ###  #####################################",
  "     #####################################   ",
  "       ################################      ",
  "         ###########################     ###",
  "           ################  ###############",
  "              ###########      #########    ",
  "                  ####            ####  ##  ",
  "                                        ##  ",
];

const WORD = "pulp ";

function buildFish(): string {
  let wi = 0;
  return MASK.map((row) =>
    row
      .split("")
      .map((c) => {
        if (c === "#") {
          const ch = WORD[wi % WORD.length];
          wi++;
          return ch === " " ? "·" : ch;
        }
        wi++;
        return " ";
      })
      .join("")
  ).join("\n");
}

export default function AsciiFish({ className = "" }: { className?: string }) {
  const art = useMemo(buildFish, []);
  return (
    <pre aria-hidden className={`ascii-fish ${className}`} data-testid="ascii-fish">
      {art}
    </pre>
  );
}
