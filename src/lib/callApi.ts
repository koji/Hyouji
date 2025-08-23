// call api
// create a label/labels
// delete a label/labels

import chalk from 'chalk';

import { extraGuideText, labels } from '../constant.js';
import {
  ConfigType,
  CreateLabelResponseType,
  ImportLabelType,
} from '../types/index.js';
const log = console.log;

export const createLabel = async (
  configs: ConfigType,
  label: ImportLabelType,
) => {
  const resp = await configs.octokit.request(
    'POST /repos/{owner}/{repo}/labels',
    {
      owner: configs.owner,
      repo: configs.repo,
      name: label.name,
      color: label.color,
      description: label.description,
    },
  );

  const status = resp.status as CreateLabelResponseType;

  switch (status) {
    case 201:
      log(chalk.green(`${resp.status}: Created ${label.name}`));
      break;
    case 404:
      log(chalk.red(`${resp.status}: Resource not found`));
      break;
    case 422:
      log(chalk.red(`${resp.status}: Validation failed`));
      break;
    default:
      log(chalk.yellow(`${resp.status}: Something wrong`));
      break;
  }
};

export const createLabels = async (configs: ConfigType) => {
  labels.forEach(async (label) => {
    createLabel(configs, label);
  });
  log('Created all labels');
  log(chalk.bgBlueBright(extraGuideText));
};

export const deleteLabel = async (
  configs: ConfigType,
  labelNames: readonly string[],
) => {
  for (const labelName of labelNames) {
    try {
      const resp = await configs.octokit.request(
        'DELETE /repos/{owner}/{repo}/labels/{name}',
        {
          owner: configs.owner,
          repo: configs.repo,
          name: labelName,
        },
      );

      if (resp.status === 204) {
        log(chalk.green(`${resp.status}: Deleted ${labelName}`));
      } else {
        log(chalk.yellow(`${resp.status}: Something wrong with ${labelName}`));
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        log(chalk.red(`404: Label "${labelName}" not found`));
      } else {
        log(
          chalk.red(
            `Error deleting label "${labelName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        );
      }
    }
  }
};

// get labels
const getLabels = async (configs: ConfigType): Promise<readonly string[]> => {
  const resp = await configs.octokit.request(
    'GET /repos/{owner}/{repo}/labels',
    {
      owner: configs.owner,
      repo: configs.repo,
    },
  );

  if (resp.status === 200) {
    const names = await resp.data.map((label) => label.name);
    return names;
  } else {
    log(chalk.red('something wrong'));
    return [];
  }
};

export const deleteLabels = async (configs: ConfigType) => {
  // get all labels
  const names = await getLabels(configs);

  if (names.length === 0) {
    log(chalk.yellow('No labels found to delete'));
    return;
  }

  log(chalk.blue(`Deleting ${names.length} labels...`));

  for (const name of names) {
    try {
      const resp = await configs.octokit.request(
        'DELETE /repos/{owner}/{repo}/labels/{name}',
        {
          owner: configs.owner,
          repo: configs.repo,
          name: name,
        },
      );

      if (resp.status === 204) {
        log(chalk.green(`${resp.status}: Deleted ${name}`));
      } else {
        log(chalk.yellow(`${resp.status}: Something wrong with ${name}`));
      }
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        error.status === 404
      ) {
        log(chalk.red(`404: Label "${name}" not found`));
      } else {
        log(
          chalk.red(
            `Error deleting label "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
          ),
        );
      }
    }
  }

  log(chalk.blue('Finished deleting labels'));
  log(chalk.bgBlueBright(extraGuideText));
};
