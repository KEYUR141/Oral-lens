# Codex with Meta models

Reference checked: 27 October 2026. This explains the dashboard option; no coding-provider settings have been changed by this task.

Codex is the coding client that manages files, commands, tools, and the coding loop. Its model provider is configurable. Meta documents a Codex configuration in which Muse Wonder supplies the model responses through Meta Model API. Muse Code is Meta's own coding client. See [Meta's coding-agent guide](https://dev.meta.ai/docs/coding-agents).

The provider pattern is also described in [official OpenAI documentation](https://developers.openai.com/codex/config-advanced/). A minimal illustrative user-level configuration is:

```toml
model = "muse-wonder-1.0"
model_provider = "meta"

[model_providers.meta]
name = "Meta Model API"
base_url = "https://api.meta.ai/v1"
env_key = "MODEL_API_KEY"
wire_api = "responses"
```

Merge with existing user settings rather than blindly appending duplicate TOML keys. Current Codex documentation places provider/auth settings in user-level configuration; project configuration is not a place to redirect credentials. Separate named user profiles are another documented option, subject to the installed client version. This file is an example, not an installed configuration or verified Meta session.

The selected provider handles the configured model requests and its API account/credits apply. Verify actual access and billing in that provider's account. Account-specific availability and features of this hosted chat or IDE integration are not established by a terminal-client example.

## Development and product inference are separate

Choosing a coding model affects development sessions. Oral-lens separately needs its own implemented Meta runtime for evidence extraction and claim review. Changing the coding provider does not implement that product integration or switch this existing conversation. No provider request or model switch was performed here.
