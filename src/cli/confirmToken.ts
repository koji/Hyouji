import prompts from 'prompts'

import { holdToken } from '../constant.js'

export const getConfirmation = async (): Promise<boolean> => {
  const response = await prompts(holdToken)
  return response.value
}
