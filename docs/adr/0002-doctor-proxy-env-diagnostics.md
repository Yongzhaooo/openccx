# ADR 0002: Doctor separates shell proxy env from running proxy process env

## Status

Accepted

## Context

`occx doctor` used to show only the proxy variables visible to the `occx doctor`
process. That is accurate for the current shell, but misleading when a user
started `occx start` or a service from a different environment and then ran
`occx doctor` in a new terminal.

Environment variables are inherited by child processes, not shared globally
between existing shells. A new terminal can therefore show `HTTP_PROXY` as unset
while the already-running openccx proxy process still has it set.

## Decision

`occx doctor` reports three separate proxy surfaces:

- the current doctor process environment
- the effective `config.proxy` state, with the value hidden
- the running openccx proxy process environment when a recorded PID is
  available and Linux `/proc/<pid>/environ` can be read

The process environment diagnostic reports only presence/absence of known proxy
keys. It never prints or stores proxy values because proxy URLs can contain
credentials.

## Consequences

- Users can distinguish "this new terminal has no proxy env" from "the running
  proxy process has no proxy env".
- Linux and WSL get an accurate runtime-process check without service-manager
  parsing.
- Non-Linux platforms show the running-process env check as unavailable instead
  of pretending service environment inspection is portable.
