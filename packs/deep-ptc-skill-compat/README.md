# deep-ptc-skill-compat

Read-only bridge from Deep PTC's public `GET /deep-ptc/skills/list` route into Tool Hub's optional
`toolHub.skillVisibility` service. Tool Hub shows a “Deep PTC 隐藏” badge on matching skill rows.

Requirements: Tool Hub 2.5.0+ and Deep PTC 2.5.6+ in the same profile.

This pack never reads or writes `$DSH_HOME/storages/deep-ptc-skills/skills.json`; if the route is absent or
the web-server port cannot be resolved, it reports unavailable and leaves the Skills page unchanged.
