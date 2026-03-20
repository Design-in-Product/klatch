---
title: You Can't Vibe Your Way to a Glossary
date: March 2026
authors: xian + Calliope
excerpt: On drawing wireframes with a reMarkable before talking to the AI, and what that produces that vibe coding doesn't: a glossary, named edge cases, and a decision record.
hero: wireframe-svg + sidebar-wireframe.png
---

I have a reMarkable tablet. Not because I'm a person who romanticizes analog tools — I'm not — but because it's the one thing that doesn't pull me somewhere else when I'm trying to think. No notifications. No browser. Just a stylus, dot-grid paper, and whatever's in my head.

I've been building Klatch with an AI development team. Daedalus writes code. Argus writes tests. Calliope writes this. Theseus tests things by hand and tells me honestly what's broken. We coordinate through a Slack-like interface, which is also what I'm building, which gives the project a certain elegance or circularity, depending on your mood.

When I needed to design the new sidebar — multi-project navigation, entity listings, channel groupings — I didn't open a design tool. I picked up a stylus and drew it.

## What's in the sketch

Here's the actual drawing:

[sidebar-wireframe.png]
*The original reMarkable sketch, March 16, 2026. Dot-grid paper, not totally sloppy.*

A few things that are unusual about this wireframe:

It has real names in it. @Daedalus, @Argus, @Calliope, @Mnemosyne. These aren't placeholder labels like "User 1" and "User 2." They're the actual agents who will use this sidebar. The standup message in the content panel — "Time for morning standup. It's Tue March 16!" — is the message I expected to see there at 8 AM, written by Daedalus in the standup channel. I drew the thing as if it were already alive.

It has two sections I had to name. At the top: entities with the @ prefix, followed by Klatch channels with the # prefix. At the bottom, below a dashed divider: *ORPHAN CHATS*. Conversations that don't belong to any project yet.

None of those labels were deliberate choices in the sense of "I will now decide what to call this." I needed to label things to draw them, so I labeled them, and by labeling them I had made decisions. That's what drawing a wireframe does. It forces specificity before you feel ready for it.

## The conversation that followed

I brought the PNG into a design conversation with Daedalus. Not: "here's what I want, please build it." Something more like: "here's what I drew, let's make sure we both understand it before we talk about how to build it."

The conversation started with the thing Daedalus noticed first: the sidebar had two kinds of channels. The @ ones and the # ones. They behaved differently — @Daedalus opens a 1:1 conversation with one entity, #standup opens a group channel with multiple entities and orchestration. Same sidebar, same list, two fundamentally different things.

What do we call them?

The word "channel" was already in the codebase for everything — 1:1s and groups alike. It's what I'd called them since the beginning. But "channel" doesn't tell you what kind it is, and in the sidebar it really matters: the @ prefix is doing work, the # is doing work, they're visually and functionally distinct. We needed words.

The answer was already in the drawing. The section at the bottom was labeled CHATS. The project name in the sketch is "klatch." So: *chat* for 1:1 conversations with a single Claude entity. *Klatch* for multi-entity group channels with orchestration.

Two words. One existing database table. The implementation was a new column: `type: 'chat' | 'klatch'`. That's it. The type discriminator let everything else fall into place — which UI sections appear in which context, which prompts apply, how the sidebar hierarchy works. A two-word glossary decision with consequences that ripple for weeks.

The conversation didn't invent those words. The drawing implied them. The conversation made them explicit and verified that we meant the same thing by them.

## Orphan chats

The bottom section of the sidebar — "ORPHAN CHATS" — is where conversations live that haven't been assigned to a project. When you import a conversation from Claude Code or claude.ai without a project context, it needs somewhere to go. In most software, it would quietly get dumped into a default bucket, never named, never visible as a concept.

I labeled it before writing a line of code. In pencil. On dot-grid paper.

That label is now a user-facing concept in the application. The term "orphan" is doing real work: it tells you that these conversations are adrift, not abandoned, waiting to be adopted into a project. It implies a workflow. It implies a user responsibility. It frames the state without stigmatizing it.

You can't vibe your way to that. Vibe coding means describing what you want and letting the AI build it; the AI doesn't name your edge cases for you. The human has to do that. And the human only does it if the design process forces them to — which drawing a wireframe does, because you can't draw something you haven't labeled.

## The decision record

After the design conversation, I wrote up the decisions in a spreadsheet. Not a spec, not a Figma file — a CSV with one row per concept and columns for how that concept maps to different environments: Claude.ai, Claude Code, the Klatch UI, the database, implementation status.

It started as a way to think through the import problem (how do you map claude.ai's concept of "project instructions" to Klatch's concept of "project instructions" when they're the same idea in different containers?). It grew into something else: a living record of every design decision, indexed by concept. When a row gets an implementation status emoji (✅, ⏳, ⚠️), the document has changed form. It's no longer a planning document. It's a decision log.

Six months from now, someone reading the codebase will find a `type` column in the `channels` table and wonder why it exists. If they look in the CSV, they'll find the row: *Channel · Chat or Klatch · Same database table, one new column · Gall's law.* The history is written down because the design conversation produced it, and the design conversation produced it because the wireframe forced the question.

## What this isn't

It is a far cry from what most people imagine when they hear "AI-assisted development." Vibe coding — describe what you want, accept what the AI builds, iterate — is real and useful for some things. I use it myself. But it doesn't produce a glossary. It doesn't produce named edge cases. It doesn't produce a decision record. It produces code, which is the last step, not the first.

Deliberate design with AI means bringing the AI into your design process, not outsourcing the design process to the AI. The wireframe is proof of work — it contains decisions that I made, not Daedalus. When I showed Daedalus the PNG, they weren't receiving a blank brief; they were receiving a document that already had answers embedded in it. The conversation's job was to surface those answers, verify them, and translate them into implementation decisions. That's collaboration. The alternative is delegation, which produces different results.

The reMarkable isn't incidental to this. It's a paper instrument with structure — the dot grid is not decorative, it's a constraint. You can't accidentally draw a wireframe. You have to decide what things are called, where they go, and what the edge cases are, before the stylus leaves the screen. That decision-making work happens in your head, not in a prompt. The AI then has something real to work with.

*Klatch is open source at [github.com/Design-in-Product/klatch](https://github.com/Design-in-Product/klatch). The data-model-thoughts.csv mentioned here lives in the repo root if you want to see what the decision record actually looks like.*

---

*Daedalus (implementation), Argus (testing), Calliope (writing), and Theseus (QA) are Claude agents working in Klatch. The sidebar they helped design is what they use to talk to each other.*
