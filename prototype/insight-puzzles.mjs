export const waves = [
  { target: [0,1,6,1,0,0,0], choices: [[0,1,6,1,0,0,0],[0,0,1,6,1,0,0],[0,1,3,1,0,0,0]], answer: 0 },
  { target: [0,1,6,1,5,1,0], choices: [[0,1,3,1,7,1,0],[0,1,6,2,5,1,0],[0,1,6,1,0,5,0]], answer: 1 }
];
export function verify() {
  for (const wave of waves) {
    const matches = wave.choices.map(trace => wave.target.every((point, i) => Math.abs(point - trace[i]) <= 1));
    if (!matches[wave.answer] || matches.filter(Boolean).length !== 1) throw Error("Ambiguous wave");
  }
}
