import prompts from 'prompts'

import { deleteLabel } from '../constant.js'

export const getTargetLabel = async (): Promise<readonly string[]> => {
  const response = await prompts(deleteLabel)
  return [response.name]
}
