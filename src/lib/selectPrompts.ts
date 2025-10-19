import prompts from 'prompts'

import { actionSelector } from '../constant.js'

export const selectAction = async (): Promise<number> => {
  const response = await prompts(actionSelector)
  const { action } = response
  return action[0] !== undefined ? action[0] : 99
}
