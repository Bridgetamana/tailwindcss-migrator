# Change Log

All notable changes to the "tailwind-migrator" extension will be documented in this file.

## [0.1.2] - 2025-06-08

### Added

- Confirmation dialog before migration
- Undo option after migration to revert changes

## [0.1.1] - 2025-05-16

### Added

- Conversion from Tailwind CSS v3 to v4 syntax
- Automatic color format conversion (HSL to OKLCH)
- Dark mode support via `@custom-variant dark` directive

### Changed

- Replaced `@tailwind` directives with `@import "tailwindcss"`
- Moved CSS variables from `@layer base` to root level

## [Unreleased]

### Added
- Diff preview before migration changes
- Dry-run mode for previewing changes without modifying files
- Improved error handling and logging
- Linting and formatting enforced via ESLint, Husky pre-commit hook, and GitHub Actions

### Changed
- Confirmation prompt only shown after diff preview
- Migration changes now applied using WorkspaceEdit for reliability

### Fixed
- Resolved issue with migration failing on closed editors
