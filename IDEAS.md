# Feature ideas

## AI (via 9router/OmniRouter, OpenAI-compatible endpoint)

- **Subscription agent (chat on the dashboard).** Tool calling over the user's own subscriptions: "how much do I spend on streaming?", "pause Netflix". Actions that change data need user confirmation before they run.
- **Fine print decoder.** Paste a service's terms (URL or text); extract cancellation notice, auto-renew rules, refund policy, trial-to-paid date. Every field carries an exact quote, and code checks the quote exists in the source (reject otherwise). Shows grounded extraction, deterministic hallucination check, long-context chunking/routing.
- **Screenshot → subscriptions.** Upload a screenshot of the iOS/Play Store subscriptions screen; a vision model returns a list to confirm before saving. Image is never stored. Shows multimodal, zod-validated structured output, human-in-the-loop.
- **SubTrack MCP server.** Expose the user's subscriptions as MCP tools so Claude/ChatGPT can query them. Reuses the `/api` routes and auth. Pairs with the agent above.
- **Free-trial trap.** Natural language ("Disney+, 7 days free, then 9.99") or a signup page → subscription with `due_date` = trial end, flagged as trial. Shows NL → date parsing with testable edge cases.
- **Overlap detector.** Flag subscriptions that do the same job (iCloud + Google One, Spotify + YouTube Premium). LLM only judges overlap; savings are computed in code. Cache per service pair.
- **Public `/lab` page.** Run the same task (e.g. fine print decoder) across several models via the router; show cost, latency and valid-JSON rate on real data. Showcases routing, fallback and evals.
