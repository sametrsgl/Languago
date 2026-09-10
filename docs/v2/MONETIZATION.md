# Languago v2 Monetization Readiness

This work prepares consent-safe infrastructure for future ads and analytics. It does **not** enable live ads, load ad/analytics providers, send network requests, or queue events before consent.

## Launch boundary

- Current state: infrastructure only. `AdSlot.astro` is disabled by default and fully hidden unless a future integration explicitly enables it.
- No provider is configured. There is no AdSense code, Google Publisher Tag, analytics SDK, pixels, external scripts, or fake production ad placeholder.
- Before launch, legal/policy review is required for every target jurisdiction, ad provider, consent copy, privacy policy wording, vendor list, and retention record. This implementation does not claim CMP certification.
- For Google advertising products in the EEA, UK, and Switzerland, Google requires legally valid consent for cookies/local storage where required and for collection, sharing, and use of personal data for ads personalization; publishers must retain consent records and give clear revocation instructions.[1]
- Google AdSense CMP guidance says publishers can use Google CMP, a third-party CMP, or their own consent dialog, and should configure ad technology providers before serving ads.[2]
- Google’s AdSense FAQ says a certified CMP integrated with IAB TCF is required for partners using Google publisher products when serving personalized ads to users in the EEA, UK, and Switzerland.[3]

## Consent model

- Default is reject: analytics `false`, advertising `false`.
- Consent is explicit opt-in only. Reject, revoke, and accept are all first-class UI actions in `PrivacyPreferences.astro`.
- Preferences are versioned at `languago:privacy-preferences:v1` and malformed, missing, unsupported, or blocked storage falls back to denied consent.
- Do Not Track and Global Privacy Control signals force analytics rejection even if a stored preference says analytics was accepted.
- Revocation takes effect immediately for future events. Events are not queued while consent is denied, so there is nothing to replay after opt-in.

## Analytics event contract

`src/lib/analytics.mjs` only dispatches a local `CustomEvent('languago:analytics')` when analytics consent is currently true. A future provider adapter may listen to that event after legal review, but this module does not pretend that data was sent.

Allowed event names:

- `lesson_completed`
- `skill_practiced`
- `item_attempted`
- `result_viewed`

Allowed payload fields:

- `level`
- `skill`
- `item`
- `attempts`
- `attempt_count`
- `correct_count`
- `incorrect_count`

Prohibited payload examples include email addresses, user IDs, free text, full URLs, URL queries, search terms, names, message bodies, raw answers, or arbitrary metadata. Disallowed fields throw before dispatch.

## Ad slot rules

- `AdSlot.astro` defaults to `enabled = false`; disabled slots render with `display: none`.
- Enabled slots reserve CSS dimensions before any future load to protect layout stability.
- Enabled slots are labelled with `aria-label="Reklam alanı"` and `role="complementary"`.
- Safe placement is limited to after learning content or after results. Do not place ad slots between a question and its answer, inside answer feedback, over controls, in sign-in flows, or in teacher/student safety-critical flows.
- There is no `ad_click` handler and no fake ad surface.

Google Publisher Tag documentation warns that ad layout shifts happen when ads are fetched, rendered, or resized, and recommends reserving space with CSS `min-height`/`min-width`; web.dev similarly recommends reserving initial layout space for late-loading content such as ads and avoiding collapse of reserved space when no ad returns.[4][5]

## Integration instructions for parent/Layout worker

1. Do not wire live providers yet.
2. Ask the Layout worker to import and mount `PrivacyPreferences.astro` in the shared footer/settings surface where users can easily accept, reject, and revoke.
3. Keep `AdSlot.astro` disabled unless a future reviewed provider feature flag exists. If enabled for layout trials, place only after lesson content or after results, never between prompt/answer interactions.
4. Provider adapter launch checklist:
   - complete legal and policy review;
   - confirm CMP/TCF requirements for target regions and provider account;
   - update privacy/cookie notices and vendor disclosure;
   - add server-side consent record retention if required;
   - ensure the provider loads only after current consent and privacy signals allow it;
   - re-run privacy tests and CLS checks.

## Verification

Implemented tests cover denied consent, revoked consent, PII/disallowed-field rejection, and ad slot disabled/empty/loaded/reserved states:

```bash
node --test tests/privacy*.mjs
```

## Sources

[1] https://www.google.com/about/company/user-consent-policy
[2] https://support.google.com/adsense/answer/7670013?hl=en
[3] https://support.google.com/adsense/answer/11546682?hl=en
[4] https://web.dev/articles/optimize-cls
[5] https://developers.google.com/publisher-tag/guides/minimize-layout-shift
