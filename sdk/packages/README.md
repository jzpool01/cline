# Packages Overview

This directory is the single documentation source for package-level responsibilities.

- High-level package roles: this file (`packages/README.md`)
- Package interaction and runtime flows: [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Package Responsibilities

| Package | Primary responsibility | Typical consumers | Internal deps |
| --- | --- | --- | --- |
| `@tarogo/shared` | Cross-package shared primitives (path resolution, session common types, indexing helpers) | `@tarogo/agents`, `@tarogo/core`, apps | None |
| `@tarogo/llms` | Model catalog + provider settings schema + handler creation SDK | `@tarogo/agents`, `@tarogo/core`, apps | None |
| `@tarogo/agents` | Stateless agent runtime loop (tools, hooks, extensions, teams, streaming) | `@tarogo/core`, apps | `@tarogo/llms`, `@tarogo/shared` |
| `@tarogo/core` | Stateful runtime orchestration (runtime composition, session lifecycle/storage, local and hub runtime services, hub discovery and client helpers) | CLI/Desktop apps | `@tarogo/agents`, `@tarogo/llms`, `@tarogo/shared` |

## How Packages Work Together

1. `@tarogo/llms` defines model/provider capabilities and builds concrete handlers.
2. `@tarogo/agents` runs the agent loop on top of those handlers and tool execution primitives.
3. `@tarogo/core` composes runtime behavior with persistent sessions/storage and local or hub-backed runtime services.
4. `@tarogo/core` hub services orchestrate scheduled runtime execution, execution history, and schedule command handling.
5. `@tarogo/core/hub` exposes discovery, the detached hub daemon, and session-oriented client APIs (`HubSessionClient`, `HubUIClient`) when hosts need a shared daemon.
6. `@tarogo/shared` provides the shared contracts and path/session primitives used across the stack.

## Practical Boundary Rules

- Put provider/model schema, cataloging, and handler wiring in `@tarogo/llms`.
- Put loop/tool/hook/team execution behavior in `@tarogo/agents`.
- Put persistence, session lifecycle, and runtime assembly in `@tarogo/core`.
- Put scheduled execution and schedule persistence in `@tarogo/core` hub services.
- Put hub discovery, attach flows, and session-oriented client adapters in `@tarogo/core/hub`.
- Put cross-package utility types and path/session constants in `@tarogo/shared`.
- Put remote-config schemas, materialization, telemetry normalization, and blob upload primitives in `@tarogo/shared/remote-config`.

## Runtime Entry Points

- Node-oriented imports exist where packages expose a distinct Node alias.
- `@tarogo/core` itself is now the Node/runtime-oriented entry point for host/session services.
- Browser entry points still exist in packages that intentionally publish a browser surface, but `@tarogo/core` no longer does.

## Notes for Doc Consolidation

Nested package `README.md` and `ARCHITECTURE.md` files can be reduced or removed after references are updated to point here.
