# Contributing

The reader deliberately separates presentation from the preserved corpus.

1. Make interface changes in `index.html`, `styles.css`, and `app.js`.
2. Keep all original questions, answers, verdicts, profiles, uncertainty, cautions, source references, exact prompts, and scope notes intact.
3. Run `python tools/verify_data.py` and `node --check app.js`.
4. Test person navigation, search and filters, question comparison, source dialogs, prompt panels, keyboard controls, and a narrow mobile viewport.
5. Describe the change and its verification in your pull request.

Do not include credentials, server `.env` files, original simulation databases, private logs, or local filesystem paths. Do not turn fictional responses into claims of real customer validation.

Any future dataset correction must be explicit and versioned, preserving the old release and documenting what changed. This release's corpus is immutable by design.
