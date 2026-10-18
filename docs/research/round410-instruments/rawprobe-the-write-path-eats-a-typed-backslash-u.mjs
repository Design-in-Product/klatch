const a = String.raw`aAb`;
const b = String.raw`a\nb`;
const c = String.raw`a\x41b`;
console.log('u:', JSON.stringify(a), a.length);
console.log('n:', JSON.stringify(b), b.length);
console.log('x:', JSON.stringify(c), c.length);
