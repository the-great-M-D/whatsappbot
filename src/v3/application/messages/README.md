# V3 live message feed

The live feed is intentionally in-memory and bounded. It is not a persistence mechanism.

Private-message persistence is not introduced here. Normal group messages remain live-only unless a later scanner/action explicitly persists a matched event through the database boundary.

The feed is capped per instance and should be treated as operational telemetry rather than message history.
