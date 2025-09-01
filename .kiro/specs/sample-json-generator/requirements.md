# Requirements Document

## Introduction

This feature adds a new menu option to the Hyouji CLI tool that allows users to generate a sample JSON file containing label data. The generated JSON file will use the existing sample data from the constants and will be saved as "hyouji.json" in the current directory. This feature will help users understand the expected JSON format for importing labels and provide them with a quick way to get started with sample data.

## Requirements

### Requirement 1

**User Story:** As a user of the Hyouji CLI tool, I want to generate a sample JSON file, so that I can understand the expected format for importing labels and have sample data to work with.

#### Acceptance Criteria

1. WHEN the user selects the action selector THEN the system SHALL display a new option "Generate sample JSON" after the "import JSON" option
2. WHEN the user selects "Generate sample JSON" THEN the system SHALL create a JSON file named "hyouji.json" in the current directory
3. WHEN the JSON file is created THEN the system SHALL use the existing `sampleData` from src/constant.ts as the content
4. WHEN the JSON file is successfully created THEN the system SHALL display a success message indicating the file location
5. IF the hyouji.json file already exists THEN the system SHALL overwrite it without prompting

### Requirement 2

**User Story:** As a user, I want the generated JSON file to contain properly formatted label data, so that I can use it directly for importing labels or as a reference for creating my own JSON files.

#### Acceptance Criteria

1. WHEN the JSON file is generated THEN the system SHALL format it as a valid JSON array
2. WHEN the JSON file is generated THEN each label object SHALL contain "name", "color", and "description" fields
3. WHEN the JSON file is generated THEN the system SHALL ensure proper JSON formatting with appropriate indentation
4. WHEN the JSON file is generated THEN the color values SHALL be in the correct format without the "#" prefix

### Requirement 3

**User Story:** As a user, I want clear feedback when generating the sample JSON file, so that I know whether the operation was successful or if any errors occurred.

#### Acceptance Criteria

1. WHEN the JSON file generation is successful THEN the system SHALL display a message "Sample JSON file generated successfully at ./hyouji.json"
2. IF an error occurs during file generation THEN the system SHALL display an appropriate error message
3. WHEN the JSON file generation completes THEN the system SHALL return to the main menu
4. WHEN the user selects this option THEN the system SHALL provide immediate feedback that the operation is in progress
