import { Octokit } from '@octokit/core';
export type ImportLabelType = {
  name: string;
  color?: string;
  description?: string;
};

export type LabelType = ImportLabelType & {
  readonly id: number;
  readonly node_id: string;
  readonly url: string;
  readonly default: boolean;
};

export type CreateLabelResponseType = 201 | 404 | 422;

export type ConfigType = {
  readonly octokit: Octokit;
  readonly owner: string;
  readonly repo: string;
  readonly fromSavedConfig?: boolean;
  readonly autoDetected?: boolean;
  readonly detectionMethod?: 'origin' | 'first-remote' | 'manual';
};

export type StoredConfigType = {
  token: string;
  owner: string;
  lastUpdated: string;
};
