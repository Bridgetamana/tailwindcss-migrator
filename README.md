# Tailwind CSS Migrator

![Extension Logo](images/icon.png)
Automatically convert Tailwind CSS v3 projects to v4 syntax

## Features
- Convert `@tailwind` directives to `@import` statements
- Accurate HSL → OKLCH color conversion
- Preserves all custom utilities and components

## Quick Start
1. Open any CSS file with Tailwind v3 syntax
2. Run command: `Tailwind: Convert to v4`
3. Review changes and save

## Configuration
```json
{
  "tailwindMigrator.autoConvert": false,
  "tailwindMigrator.showDiff": true
}