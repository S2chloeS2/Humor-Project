# Humor Project

Two Next.js apps exploring how an LLM can be taught a *style* of humor rather than
asked for "something funny."

**Live:** https://humor-project-ten.vercel.app

## `humor-prompt-chain`

An admin tool for building and testing **humor flavors** — ordered sequences of prompt
steps that transform an input image into captions. A flavor is a chain, not a prompt:

1. Describe the image in plain text
2. Find something absurd or ironic in that description
3. Write five short, punchy captions from that angle

Splitting the work into named steps makes the humor debuggable. When the output is flat
you can see *which* step went flat, instead of rewriting one long prompt and hoping.

Features: flavor CRUD with slugs, step ordering, and live generation against the
pipeline API.

## `humor_project`

The consumer-facing Next.js app that runs the flavors.

## Stack

Next.js · TypeScript · Tailwind · deployed on Vercel

---

© 2026 Chloe Joo-yeon Lee
