# Meta Muse configuration and smoke test

Updated: 29 October 2026. The participant requested a normal API test after attempting to add a payment method. This setup does not change billing, verify a card, or bypass a provider requirement.

## Canonical project settings

Use these exact names in the ignored root `.env`:

```dotenv
Meta_Muse_API_KEY=
Meta_Muse_MODEL=muse-spark-1.3
```

Enter your key locally. Do not put it in a frontend variable, tracked file, terminal command argument, or chat message. The application loads the root `.env` through `utils/settings.py`; process environment values take precedence. Old generic Meta environment names are no longer read by application code. An existing key was preserved when migrating names; a missing key remains blank.

## Run

Validate configuration without contacting the provider:

```powershell
uv run python test_muse_llm.py --check-config
```

After saving a real key, make one small request:

```powershell
uv run python test_muse_llm.py
```

The script sends a fixed connectivity prompt, requests at most 128 output tokens by default with minimal reasoning effort, and uses a bounded timeout. It does not read the database or send research/patient documents. It prints model ID, a bounded response, reported token usage, and elapsed time on success. An optional `--max-tokens` value between 16 and 512 is available if a model uses the initial budget without producing visible text. Each invocation can consume API credits; importing the script and `--check-config` do not send a request.

Exit codes: 0 means a successful completion or valid check-only configuration; 1 means a provider/network/protocol failure; 2 means missing/invalid configuration. Empty or malformed HTTP-200 output does not count as working generation. The script is manual; the normal pytest suite does not execute a live API call.

## Shared backend client

`app/muse.py` makes direct HTTPS requests to Meta's Chat Completions endpoint using the already installed requests library. It reads only the canonical settings above, does not create a client or request at app startup, disables redirects, and makes no automatic retries. Connection errors are separated from provider HTTP errors; raw credentials and request headers are not printed.

The inherited `app/llm.py` answer function now uses this shared Meta client in place of Gemini. The `/query` route remains controlled by `ENABLE_LEGACY_QUERY=false` by default. This provider migration does not implement the planned structured review tools, verified citations, or study comparison, and does not establish medical-request handling quality.

## Interpreting failures

| Result | What to check |
| --- | --- |
| Configuration failure | Save the key and a real Muse model ID in the canonical variables |
| HTTP 400 | Request/model parameters; inspect the sanitized provider message |
| HTTP 401 | API key/authentication |
| HTTP 402 | Billing or payment action in the Meta dashboard |
| HTTP 403 | Account/model permissions or verification; use the provider's actual explanation |
| HTTP 404 | Model/endpoint availability for the account |
| HTTP 429 | Rate limits or quota/usage restrictions |
| Connection/timeout | Network/proxy access; this does not prove a billing failure |
| Empty/unexpected output | Response format, output-token budget, or model behavior |

These are diagnostic starting points, not a guarantee of how every provider error is classified. If Meta reports that verification is required, complete it through Meta/SBI. Do not retry in a loop, swap identities, or represent a failed request as account access.

## Verification status

34 offline tests pass: the existing 16 setup checks plus 18 new Meta-client/script checks. The new checks mock all HTTP responses and verify canonical configuration, successful output, HTTP errors, timeouts, malformed output, no request on import/config check, and secret redaction.

On 29 October the real `Meta_Muse_API_KEY` was blank. The manual configuration check stopped before any network request, and the participant said they would add the key later. **Live model access, applied credit usage, and payment-verification status remain untested.** A successful local test suite is not a successful provider call.

## References

- [Meta quickstart](https://dev.meta.ai/docs/quickstart)
- [Meta model catalog](https://dev.meta.ai/docs/models)
- [Meta reasoning controls and token budgets](https://dev.meta.ai/docs/reasoning)

Documentation was consulted on 29 October; actual account/model availability must be established by the later live request.

## Subsequent participant-reported live result

On 29 October the participant supplied successful smoke output: muse-spark-1.3, MUSE_OK, 33 total tokens, finish_reason stop, 2.97 seconds. This establishes basic text generation for that run; the new review graph, native structured output and tool calling remain unverified live. Historical key-absent statements above describe the earlier setup, not the current credential state.
