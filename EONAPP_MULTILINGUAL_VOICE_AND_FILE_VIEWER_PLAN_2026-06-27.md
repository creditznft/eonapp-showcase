# EONAPP — Multilingual Voice and File Viewer Plan

Date: 2026-06-27
Status: plan only. English voice-to-text already worked in manual user testing, but multilingual proof is not complete.

## Goal

A non-English user should be able to open EONAPP, press the microphone, speak in their local language, and get useful EONBOT guidance without learning settings.

## Voice strategy

### Launch approach

Use the browser's speech recognition capability where available. Keep it transparent and graceful:

- Show microphone only when supported.
- Add language selector near voice/settings: Auto, English, Hindi, Spanish, Portuguese, French, German, Arabic, Bengali, Russian, Indonesian, Japanese/Korean as later proof allows.
- Persist preferred speech language locally.
- Pass recognized text into EONBOT as normal chat text.
- Preserve the original recognized language in the message metadata.
- Let EONBOT reply in the same language unless user changes language.

### Guide Mode

Guide Mode can support multilingual UX without a cloud model by using translated built-in product guidance for the core actions:

- Start chat.
- Add files.
- Build website.
- Open Forge.
- Create backup.
- Set up local AI.
- Add API key.
- Open City.
- Ask for help.

When a true model is unavailable, do not pretend to understand everything. Use honest local guidance and offer setup.

### Connected/local model path

When a model provider or local runtime is configured, pass the recognized text to the selected model with the instruction to answer in the user's language. Do not require the user to write English.

## Voice validation checklist

- Microphone permission prompt is clear.
- Language selector affects recognition `lang`.
- English, Hindi and one non-Indian language are manually tested first.
- No transcript is uploaded unless the user sends the message.
- Speech failure has a clear fallback: type, change language, or retry.
- Chat composer stays visible during speech input.

## File attachment/viewer strategy

The app should let users drop files into the chat area, but each file type needs truthful support.

### Phase 1 viewer support

- Images: preview thumbnail and metadata.
- Plain text: preview and attach.
- Markdown: preview text plus raw view.
- Code files: raw/code preview.
- PDF: browser-safe embedded viewer or extraction placeholder; do not claim OCR unless implemented.
- CSV: table preview.
- JSON: formatted preview.
- Audio/video: metadata and browser preview if supported.

### Phase 2 viewer support

- DOCX/PPTX/XLSX: safe metadata + extractable text only when a parser exists.
- Large files: local summary metadata first; ask before indexing.
- Project imports: route code/source packages to Forge instead of Chat.

### Safety rules

- No executing uploaded files.
- No remote upload by default.
- No secrets shown in share/export receipts.
- File limits and unsupported-type messages must be clear.

## Next implementation

- W382B: robust file type registry and local viewer states.
- W383B: PDF/Markdown/CSV/JSON viewers.
- W394B: multilingual voice selector and same-language Guide Mode copy.
