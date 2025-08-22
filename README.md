# Tailwind CSS v3 to v4 Migrator

![Extension Logo](images/icon.png)

A VS Code extension that automates the process of migrating your CSS files from Tailwind CSS v3 to the v4 syntax. It handles directive changes, color conversions, and provides workspace-wide migration tools to streamline your upgrade process.

![Demo GIF](images\demo.gif)

## Features
- Convert `@tailwind` directives to `@import` statements
- Accurate HSL → OKLCH color conversion
- Preserves all custom utilities and components
- Review all proposed changes in a diff view before they are applied, so you always have the final say

## Quick Start
1. Open any CSS file with Tailwind v3 syntax
2. Run command: `Tailwind: Convert to v4`
3. Review changes and save

Developed by Bridget. Licensed under MIT.