# Implementation Plan

- [x] 1. Create the JSON generation module
  - Create `src/lib/generateSampleJson.ts` with the core JSON generation functionality
  - Import required dependencies (fs, chalk, sampleData)
  - Implement async function that writes sampleData to hyouji.json with proper formatting
  - Add comprehensive error handling with user-friendly messages
  - _Requirements: 1.2, 1.4, 2.1, 2.3, 3.1, 3.2_

- [x] 2. Update the action selector menu
  - Modify `actionSelector.choices` array in `src/constant.ts` to include "Generate sample JSON" option
  - Insert new option at index 5 with value 5 (after "import JSON")
  - Update subsequent option values to maintain correct indexing
  - _Requirements: 1.1_

- [x] 3. Integrate with main application flow
  - Add new case 5 in the switch statement in `src/index.ts`
  - Import and call the `generateSampleJson` function
  - Add try-catch error handling around the function call
  - Set `firstStart = firstStart && false` to maintain existing behavior
  - _Requirements: 1.1, 1.3, 3.3_

- [x] 4. Write unit tests for JSON generation
  - Create test file for the generateSampleJson module
  - Test successful JSON file creation with correct content and formatting
  - Test file overwrite behavior when hyouji.json already exists
  - Test error handling for file system errors
  - Verify proper user feedback messages
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 5. Write integration tests for menu functionality
  - Test that new menu option appears correctly in action selector
  - Test that selecting the option triggers the correct function
  - Test that the application returns to main menu after execution
  - Test end-to-end flow from menu selection to file creation
  - _Requirements: 1.1, 1.3, 3.3_

- [x] 6. Validate generated JSON compatibility
  - Test that generated hyouji.json file can be successfully imported using existing import functionality
  - Verify JSON structure matches expected format for label import
  - Test that all sample data fields are correctly preserved
  - _Requirements: 2.1, 2.2, 2.4_
