# OpenAI connection handoff

The website currently runs as a static export. The assistant explicitly uses local knowledge navigation, not a language model. No API key is present and no OpenAI request is made by the browser.

`assistant-handler.mjs` provides a server-only Responses API adapter for a future authenticated `/api/assistant` route. It is not included in static hosting. When connection settings are supplied, deploy it in a supported server environment, configure secret `OPENAI_API_KEY` and server-only `OPENAI_MODEL`, then wire the client to the deployed route. Never put either key in browser storage or `NEXT_PUBLIC_*` variables. Before public launch, configure rate limiting and an admin authorization policy; the adapter currently requires a platform-authenticated identity.

The announcement settings in this preview use browser storage and synchronize across same-origin tabs. For organization-wide administration, move them to authenticated server storage before public launch. Site access remains private.
