# Implementation Plan

- [x] 1. Set up YAML parsing dependencies and utilities
  - Add @types/js-yaml as dev dependency to package.json
  - Create utility functions for file format detection based on extensions
  - Create YAML parsing function using js-yaml library
  - Write unit tests for format detection utility
  - _Requirements: 5.2, 5.3_

- [x] 2. Extend import functionality to support multiple formats
  - Rename importJson.ts to importLabels.ts for format neutrality
  - Refactor importLabelsFromJson function to importLabelsFromFile
  - Implement format detection logic using file extensions
  - Add YAML content parsing alongside existing JSON parsing
  - _Requirements: 1.2, 2.1, 5.1_

- [x] 3. Implement YAML-specific error handling
  - Add YAML syntax error handling with detailed error messages
  - Implement format validation for unsupported file extensions
  - Create error messages that match existing JSON error handling patterns
  - Write unit tests for YAML parsing error scenarios
  - _Requirements: 1.4, 3.2, 5.4_

- [x] 4. Update validation logic for both formats
  - Ensure existing validation logic works for both JSON and YAML parsed data
  - Maintain same field validation (name required, color/description optional)
  - Keep same unknown field warnings for both formats
  - Write unit tests to verify validation consistency across formats
  - _Requirements: 2.2, 2.3, 2.4, 3.4, 3.5_

- [x] 5. Update user interface and prompts
  - Modify file input prompts to mention both JSON and YAML support
  - Update progress reporting to work with both formats
  - Ensure error messages reference both supported formats
  - Update main menu integration to use new importLabelsFromFile function
  - _Requirements: 1.1, 4.1, 4.2, 4.3, 4.4_

- [x] 6. Create comprehensive test coverage
  - Write unit tests for YAML parsing with valid and invalid files
  - Create test fixtures with sample YAML files (valid and invalid)
  - Write integration tests for end-to-end YAML import workflow
  - Add compatibility tests to ensure JSON functionality remains unchanged
  - _Requirements: 1.3, 3.1, 3.3_

- [x] 7. Update project documentation and examples
  - Create sample YAML files demonstrating the supported format
  - Update any existing documentation to mention YAML support
  - Add YAML examples to match existing JSON examples
  - _Requirements: 2.1_
