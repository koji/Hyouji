# Label Import Examples

This directory contains sample files demonstrating the supported formats for importing GitHub labels using Hyouji.

## Files

### Basic Examples

- **`labels.json`** - Basic label examples in JSON format
- **`labels.yaml`** - Basic label examples in YAML format

These files demonstrate:

- Required and optional fields
- Labels with all fields (name, color, description)
- Labels with minimal configuration (name only)
- Labels without optional fields

### Project Management Examples

- **`project-labels.json`** - Project management labels in JSON format
- **`project-labels.yaml`** - Project management labels in YAML format

These files contain a subset of the predefined labels used by Hyouji, organized by categories:

- Type labels (Bug Fix, Enhancement, Improvement, Security Fix)
- Status labels (Available, In Progress, Completed, Canceled)
- Priority labels (High, Medium, Low)
- Effort labels (Light, Normal, Heavy)

## Usage

To import labels from any of these files:

1. Run `hyouji` or `npx hyouji`
2. Select "Import labels from JSON or YAML file"
3. Enter the path to one of these example files
4. Follow the prompts to complete the import

## Format Requirements

### JSON Format

- Must be a valid JSON array
- Each label must be an object with at least a `name` field
- `color` and `description` fields are optional

### YAML Format

- Must be a valid YAML array
- Each label must have at least a `name` field
- `color` and `description` fields are optional
- Supports YAML comments for documentation

## Field Specifications

- **`name`** (required): String - The label name
- **`color`** (optional): String - Hex color code without the `#` symbol (e.g., "d73a4a")
- **`description`** (optional): String - Label description

Both formats will produce identical results when imported.
