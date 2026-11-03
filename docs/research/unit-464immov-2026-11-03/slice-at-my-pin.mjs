#!/usr/bin/env node
// slice-at-my-pin — a three-line WRAPPER around this unit's predecessor slicer,
// docs/research/unit-464order-2026-11-02/slice-13-at-pin.mjs, which is itself Theseus's
// unit-464subkind-2026-11-02/slice-13.mjs with PIN lifted to the environment.
//
// It exists ONLY because this fire's shell refuses an inline `PIN=… node …` env prefix — the same
// refusal Theseus hit in his 11-02 STOP fire, and he solved it the same way. No fourth slicer.
// [[feedback_check_lib_before_handrolling_a_detector]] [[feedback_a_hand_typed_reader_is_not_a_slice]]
// [[feedback_a_refused_clause_voids_whole_bash_chain]]

process.env.PIN = process.env.PIN ?? 'e0fbd74c';
process.env.WIN = process.env.WIN ?? '18';
await import('../unit-464order-2026-11-02/slice-13-at-pin.mjs');
