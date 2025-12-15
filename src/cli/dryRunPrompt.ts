import prompts from 'prompts'

import { dryRunToggle } from '../constant.js'

export const getDryRunChoice = async (): Promise<boolean> => {
  const response = await prompts(dryRunToggle)
  return Boolean(response.dryRun)
}
