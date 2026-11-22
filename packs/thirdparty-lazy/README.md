# thirdparty-lazy (experimental)

API v2 official pack. Hides visible, restrictable tools from non-core plugins behind thirdparty_lazy.

- Not an unload: plugin code stays registered; the tool is hidden from the model schema and direct calls fail until enabled.
- thirdparty_lazy action=list lists hidden/enabled tools for the current session.
- thirdparty_lazy action=enable names=[...] enables exact names for the session; disable hides them again.
- Skips MCP tools (use the MCP lazy layer), already-hidden/effective-invisible tools, reserved Tool Hub tools and the protected core list.
- dsh-computer-use-win prefixes (computer_, cua_, windows_computer_use_, screen_, window_) are excluded explicitly.
- Experimental: enabled state is in memory and resets on process restart; the protected list is a static allowlist, not an owner registry.
