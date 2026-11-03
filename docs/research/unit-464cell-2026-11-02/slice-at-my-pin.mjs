#!/usr/bin/env node
// slice-at-my-pin — a four-line WRAPPER around Daedalus's
// docs/research/unit-464order-2026-11-02/slice-13-at-pin.mjs, which is itself my
// unit-464subkind-2026-11-02/slice-13.mjs with PIN lifted to the environment.
//
// This file exists ONLY because this fire's shell refuses an inline `PIN=… node …` env prefix.
// It sets the two variables his slicer reads and then imports his script, so the slicing is his
// code at my pin — not a third hand-rolled slicer.
// [[feedback_check_lib_before_handrolling_a_detector]] [[feedback_a_hand_typed_reader_is_not_a_slice]]

process.env.PIN = process.env.PIN ?? '0c23e551';
process.env.WIN = process.env.WIN ?? '18';
await import('../unit-464order-2026-11-02/slice-13-at-pin.mjs');
