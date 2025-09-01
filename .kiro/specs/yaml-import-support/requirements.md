# Requirements Document

## Introduction

This feature extends Hyouji's import functionality to support YAML files in addition to the existing JSON format. Users will be able to import multiple GitHub labels from YAML files, providing a more human-readable and flexible format for label configuration. The YAML import will maintain the same validation and error handling standards as the existing JSON import functionality.

## Requirements

### Requirement 1

**User Story:** As a GitHub repository maintainer, I want to import labels from YAML files, so that I can use a more readable and maintainable format for my label configurations.

#### Acceptance Criteria

1. WHEN a user selects the import option THEN the system SHALL prompt for both JSON and YAML file formats
2. WHEN a user provides a YAML file path THEN the system SHALL parse the YAML content correctly
3. WHEN the YAML file contains valid label data THEN the system SHALL import all labels successfully
4. WHEN the YAML file is malformed THEN the system SHALL display clear error messages about syntax issues

### Requirement 2

**User Story:** As a user, I want YAML files to support the same label structure as JSON files, so that I can easily migrate between formats without changing my data structure.

#### Acceptance Criteria

1. WHEN parsing YAML files THEN the system SHALL support the same fields as JSON (name, color, description)
2. WHEN a YAML file contains required 'name' field THEN the system SHALL accept the label for import
3. WHEN a YAML file contains optional 'color' and 'description' fields THEN the system SHALL include them in the label creation
4. WHEN a YAML file contains unknown fields THEN the system SHALL warn the user but continue processing

### Requirement 3

**User Story:** As a user, I want comprehensive validation for YAML imports, so that I can identify and fix data issues before attempting to create labels on GitHub.

#### Acceptance Criteria

1. WHEN the YAML file doesn't exist THEN the system SHALL display a file not found error
2. WHEN the YAML contains invalid syntax THEN the system SHALL display parsing error details
3. WHEN the YAML structure is not an array THEN the system SHALL display a structure validation error
4. WHEN individual label objects are missing required fields THEN the system SHALL skip invalid entries and report them
5. WHEN field types are incorrect THEN the system SHALL validate and report type errors

### Requirement 4

**User Story:** As a user, I want the same progress reporting and error handling for YAML imports as JSON imports, so that I have consistent feedback during the import process.

#### Acceptance Criteria

1. WHEN importing from YAML THEN the system SHALL display progress indicators showing current label being processed
2. WHEN labels fail to create THEN the system SHALL continue processing remaining labels and report failures
3. WHEN import completes THEN the system SHALL display a summary of successful and failed label creations
4. WHEN all labels import successfully THEN the system SHALL display a success message with count

### Requirement 5

**User Story:** As a user, I want to be able to choose between JSON and YAML formats when importing, so that I can use my preferred format without changing the existing workflow.

#### Acceptance Criteria

1. WHEN the user selects import labels option THEN the system SHALL detect file format based on file extension
2. WHEN a file has .yaml or .yml extension THEN the system SHALL use YAML parsing
3. WHEN a file has .json extension THEN the system SHALL use existing JSON parsing
4. WHEN a file has an unsupported extension THEN the system SHALL display an error message about supported formats
