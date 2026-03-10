# Career Docs

This folder is the source-of-truth for resume/CV content, templates, styles, and PDF export.

## Edit Here
- `careerDocs.json` - all content data
- `career-doc-content.html` - section rendering
- `document.html` - document layout shell
- `career-docs.css` - document styling
- `resume.liquid` / `cv.liquid` - Eleventy page entries
- `export-pdf.mjs` - Playwright PDF export

## Commands
- `npm run docs:sync` - copy these sources into Eleventy runtime paths
- `npm run build` - sync + Eleventy build
- `npm run pdf:resume` / `npm run pdf:cv` / `npm run pdf:all`
