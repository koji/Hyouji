import { render } from 'oh-my-logo';

// for github configs
export const githubConfigs = [
  {
    type: 'password',
    name: 'octokit',
    message: 'Please type your personal token',
  },
  {
    type: 'text',
    name: 'owner',
    message: 'Please type your GitHub account',
  },
  {
    type: 'text',
    name: 'repo',
    message: 'Please type your target repo name',
  },
];

export const newLabel = [
  {
    type: 'text',
    name: 'name',
    message: 'Please type new label name',
  },
  {
    type: 'text',
    name: 'color',
    message: 'Please type label color without "#" ',
  },
  {
    type: 'text',
    name: 'description',
    message: 'Please type label description',
  },
];

export const deleteLabel = {
  type: 'text',
  name: 'name',
  message: 'Please type label name you want to delete',
};

export const jsonFilePath = {
  type: 'text',
  name: 'filePath',
  message: 'Please type the path to your JSON file',
};

export const actionSelector = {
  type: 'multiselect',
  name: 'action',
  message: 'Please select an action',
  choices: [
    { title: 'create a label', value: 0 },
    { title: 'create multiple labels', value: 1 },
    { title: 'delete a label', value: 2 },
    { title: 'delete all labels', value: 3 },
    { title: 'import JSON', value: 4 },
    { title: 'Display your settings', value: 5 },
    { title: 'exit', value: 6 },
  ],
};

export const holdToken = {
  type: 'confirm',
  name: 'value',
  message: 'Do you have a personal token?',
  initial: true,
};

export const labels =
  // the following labels are based on this post
  // https://qiita.com/willow-micro/items/51eeb3efe5b4192a4abd
  [
    {
      name: 'Type: Bug Fix',
      color: 'FF8A65',
      description: 'Fix features that are not working',
    },
    {
      name: 'Type: Enhancement',
      color: '64B5F7',
      description: 'Add new features',
    },
    {
      name: 'Type: Improvement',
      color: '4DB6AC',
      description: 'Improve existing functionality',
    },
    {
      name: 'Type: Modification',
      color: '4DD0E1',
      description: 'Modify existing functionality',
    },
    {
      name: 'Type: Optimization',
      color: 'BA68C8',
      description: 'Optimized existing functionality',
    },
    {
      name: 'Type: Security Fix',
      color: 'FF8A65',
      description: 'Fix security issue',
    },
    {
      name: 'Status: Available',
      color: '81C784',
      description: 'Waiting for working on it',
    },
    {
      name: 'Status: In Progress',
      color: '64B5F7',
      description: 'Currently working on it',
    },
    {
      name: 'Status: Completed',
      color: '4DB6AC',
      description: 'Worked on it and completed',
    },
    {
      name: 'Status: Canceled',
      color: 'E57373',
      description: 'Worked on it, but canceled',
    },
    {
      name: 'Status: Inactive (Abandoned)',
      color: '90A4AF',
      description: 'For now, there is no plan to work on it',
    },
    {
      name: 'Status: Inactive (Duplicate)',
      color: '90A4AF',
      description: 'This issue is duplicated',
    },
    {
      name: 'Status: Inactive (Invalid)',
      color: '90A4AF',
      description: 'This issue is invalid',
    },
    {
      name: "Status: Inactive (Won't Fix)",
      color: '90A4AF',
      description: 'There is no plan to fix this issue',
    },
    {
      name: 'Status: Pending',
      color: 'A2887F',
      description: 'Worked on it, but suspended',
    },
    {
      name: 'Priority: ASAP',
      color: 'FF8A65',
      description: 'We must work on it asap',
    },
    {
      name: 'Priority: High',
      color: 'FFB74D',
      description: 'We must work on it',
    },
    {
      name: 'Priority: Medium',
      color: 'FFF177',
      description: 'We need to work on it',
    },
    {
      name: 'Priority: Low',
      color: 'DCE775',
      description: 'We should work on it',
    },
    {
      name: 'Priority: Safe',
      color: '81C784',
      description: 'We would work on it',
    },
    {
      name: 'Effort Effortless',
      color: '81C784',
      description: 'No efforts are expected',
    },
    {
      name: 'Effort Heavy',
      color: 'FFB74D',
      description: 'Heavy efforts are expected',
    },
    {
      name: 'Effort Normal',
      color: 'FFF177',
      description: 'Normal efforts are expected',
    },
    {
      name: 'Effort Light',
      color: 'DCE775',
      description: 'Light efforts are expected',
    },
    {
      name: 'Effort Painful',
      color: 'FF8A65',
      description: 'Painful efforts are expected',
    },
    {
      name: 'Feedback Discussion',
      color: 'F06293',
      description: 'A discussion about features',
    },
    {
      name: 'Feedback Question',
      color: 'F06293',
      description: 'A question about features',
    },
    {
      name: 'Feedback Suggestion',
      color: 'F06293',
      description: 'A suggestion about features',
    },
    {
      name: 'Docs',
      color: '000',
      description: 'Documentation',
    },
  ];

export const initialText = `Please input your GitHub info`;

export const getAsciiText = () => render('Hyouji', {
  palette: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
  font: 'Big',
  direction: 'diagonal',
});

export const extraGuideText = `If you don't see action selector, please hit space key.`;

export const linkToPersonalToken = 'https://github.com/settings/tokens';
