// Round 368, Theseus. Two-sided reading of :3001, taken from the fleet's own instrument
// rather than a hand-rolled bind (Round 272 / Daedalus's Round 367 §3: two of the three bind
// readings say `free` about a port that is demonstrably held).
import { somethingIsAlreadyAnswering } from '../../../scripts/lib/probe-server-ownership.mts';

const answer = await somethingIsAlreadyAnswering(3001);
console.log(`:3001 somethingIsAlreadyAnswering -> ${answer === null ? 'null (free)' : answer}`);
