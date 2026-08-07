# Design Decisions

## better-sqlite3 version: ^13.0.0 (not ^11.0.0)

The plan originally specified better-sqlite3 ^11.0.0, but v11 does not compile on Node.js 26.5.0 (it uses deprecated V8 APIs). Bumped to ^13.0.0 which requires Node >=22 and compiles cleanly. The @types/better-sqlite3@7.6.0 types remain compatible.