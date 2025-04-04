const fs = require('node:fs');
const readline = require('node:readline');

const CAPS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const HEX_CHARS = "0123456789abcdefABCDEF"

const isAllHex = (s) => {
  return s.split("").every(c => HEX_CHARS.includes(c));
};

async function processLineByLine() {
  // For example:
  // https://raw.githubusercontent.com/dwyl/english-words/refs/heads/master/words.txt
  const fileStream = fs.createReadStream('words.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  const replacements = [
    {
    id: "l to 1",
    replacement: [/l/gi, "1"]
    },
    {
      id: "i to 1",
      replacement: [/i/gi, "1"]
    },
    {
      id: "a to 4",
      replacement: [/a/gi, "4"],
      skippable: true,
    },
    {
      id: "et to 37",
      replacement: [/et/gi, "37"]
    },
    {
      id: "e to 3",
      replacement: [/e/gi, "3"],
      skippable: true,
    },
    {
      id: "o to 0",
      replacement: [/o/gi, "0"]
    },
    {
      id: "t to 7",
      replacement: [/t/gi, "7"]
    },
    {
      id: "b to 6",
      replacement: [/b/gi, "6"]
    },
    {
      id: "b to 8",
      replacement: [/b/gi, "8"]
    },
    {
      id: "g to 9",
      replacement: [/g/gi, "9"]
    },
    {
      id: "q to 9",
      replacement: [/q/gi, "9"]
    },
    {
      id: "h to #",
      replacement: [/h/gi, "#"]
    },
    {
        id: "s to 5",
        replacement: [/s/gi, "5"]
    }
  ];

  let hexWords = {};

  for await (const line of rl) {
    const chars = line.split("");
    const lowerLine = line.toLowerCase();
    if (
      // Length 2 ones like "is" -> "15" aren't interesting enough
      line.length <= 2
      // Skip acronyms
      || (
        chars.every(c => CAPS.includes(c))
        // The initial dataset had "DAD" but not "dad".
        // A good heuristic would be "does the word with an -s, -ed,
        // -er, or -ing ending exist in the data set" but that would
        // require pulling the dataset into memory all at once and
        // iterating it multiple times. This is a worse heurististic,
        // but it does have the advantage of being calculatable from
        // just the line itself, and it does work for the known example.
        && lowerLine.split("").reverse().join("") !== lowerLine
      )
      // Skip all number "words"
      || chars.every(c => NUMBERS.includes(c))
    ) {
      continue
    }

    let currents = [lowerLine];

    let usedReplacementsByIndex = {};

    if (line == 'toadied') {
        debugger
    }

    for (replacement of replacements) {
      const [from, to] = replacement.replacement;

      const length = currents.length;
      for (let i = 0; i < length; i += 1) {
        const current = currents[i];

        const replaced = current.replaceAll(from, to);
        if (current != replaced) {
          // Skipping doesn't matter if applying it wouldn't do anything
          if (replacement.skippable) {
            // We expect this to go to the end of currents and not be iterated over.
            currents.push(current);
          }

          currents[i] = replaced;
          if (!usedReplacementsByIndex[i]) {
            usedReplacementsByIndex[i] = []
          }
          usedReplacementsByIndex[i].push(replacement);
        }
      }
    }

    for (let i = 0; i < currents.length; i += 1) {
        const current = currents[i];
        if (isAllHex(current)) {
          hexWords[current] = {
            original: lowerLine,
            usedReplacements: (usedReplacementsByIndex[i] || []).map(r => r.id),
          };
        }
    }
  }

  console.log(JSON.stringify(hexWords))

  const assertExists = (key) => {
    if (!hexWords[key]) {
      console.error("\"" + key + "\" was missing")
    }
  }

  assertExists("d4d4");
  assertExists("dada");
  assertExists("d4d");
  assertExists("dad");
}

processLineByLine();
