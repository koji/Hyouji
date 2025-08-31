# Design Document

## Overview

The sample JSON generator feature will add a new menu option to the Hyouji CLI tool that generates a sample JSON file containing label data. This feature will integrate seamlessly with the existing menu system and follow the established patterns in the codebase for file operations and user feedback.

## Architecture

The feature will be implemented following the existing architectural patterns:

1. **Menu Integration**: Update the `actionSelector` in `src/constant.ts` to include the new option
2. **Main Application Flow**: Add a new case in the switch statement in `src/index.ts`
3. **Dedicated Module**: Create a new module `src/lib/generateSampleJson.ts` to handle the JSON generation logic
4. **File System Operations**: Use Node.js `fs` module for file writing operations, following the pattern established in `importJson.ts`

## Components and Interfaces

### 1. Constants Update (`src/constant.ts`)

- **Modification**: Update the `actionSelector.choices` array to include a new option "Generate sample JSON"
- **Position**: Insert the new option at index 5 (after "import JSON" and before "Display your settings")
- **Value**: Assign value `5` to the new option and increment subsequent option values

### 2. Main Application Logic (`src/index.ts`)

- **Modification**: Add a new case `5` in the main switch statement
- **Functionality**: Call the new `generateSampleJson()` function
- **Error Handling**: Wrap the function call in try-catch block for proper error handling
- **Flow Control**: Set `firstStart = firstStart && false` to maintain existing behavior

### 3. JSON Generation Module (`src/lib/generateSampleJson.ts`)

**Function Signature:**

```typescript
export const generateSampleJson = async (): Promise<void>
```

**Key Responsibilities:**

- Import `sampleData` from constants
- Format data as JSON with proper indentation
- Write to `hyouji.json` in current directory
- Provide user feedback on success/failure

**Dependencies:**

- `fs` module for file operations
- `chalk` for colored console output
- `sampleData` from `../constant.js`

## Data Models

### Input Data Structure

The function will use the existing `sampleData` array from constants:

```typescript
type LabelData = {
  name: string;
  color: string;
  description: string;
}[];
```

### Output JSON Format

The generated JSON file will contain:

```json
[
  {
    "name": "Type: Bug Fix",
    "color": "FF8A65",
    "description": "Fix features that are not working"
  },
  {
    "name": "Type: Enhancement",
    "color": "64B5F7",
    "description": "Add new features"
  },
  {
    "name": "Type: Improvement",
    "color": "4DB6AC",
    "description": "Improve existing functionality"
  }
]
```

## Error Handling

### File System Errors

- **Permission Issues**: Display clear error message if unable to write to current directory
- **Disk Space**: Handle insufficient disk space errors gracefully
- **Path Issues**: Handle invalid path scenarios

### Error Messages

- **Success**: `"✅ Sample JSON file generated successfully at ./hyouji.json"`
- **Write Error**: `"❌ Error generating sample JSON file: [error message]"`
- **Generic Error**: `"❌ An unexpected error occurred while generating the sample JSON file"`

### Error Recovery

- Display error message using `chalk.red()`
- Return to main menu without crashing the application
- Log detailed error information for debugging

## Testing Strategy

### Unit Testing

1. **JSON Generation Logic**
   - Test that `sampleData` is correctly formatted as JSON
   - Verify proper indentation (2 spaces)
   - Ensure valid JSON structure

2. **File Operations**
   - Test successful file creation
   - Test file overwrite behavior
   - Test error handling for write failures

3. **User Feedback**
   - Verify correct success messages
   - Verify appropriate error messages
   - Test console output formatting

### Integration Testing

1. **Menu Integration**
   - Test new menu option appears correctly
   - Test option selection triggers correct function
   - Test menu flow continues properly after execution

2. **End-to-End Flow**
   - Test complete user journey from menu selection to file creation
   - Verify generated file can be used with existing import functionality
   - Test error scenarios don't break application flow

### Manual Testing Scenarios

1. **Happy Path**: Select option, verify file creation and content
2. **File Overwrite**: Generate file twice, verify overwrite behavior
3. **Permission Issues**: Test in read-only directory
4. **Integration**: Use generated file with import JSON feature

## Implementation Notes

### Code Style Consistency

- Follow existing TypeScript patterns in the codebase
- Use `chalk` for colored output consistent with other modules
- Use `async/await` pattern for file operations
- Follow existing error handling patterns

### File Formatting

- Use `JSON.stringify()` with 2-space indentation for consistency
- Ensure proper line endings for cross-platform compatibility
- Generate clean, readable JSON that serves as a good example

### User Experience

- Provide immediate feedback when operation starts
- Clear success/error messaging
- Maintain consistent CLI interaction patterns
- Return to main menu after completion
