import prompts from 'prompts'

import { labelFilePath } from '../constant.js'

export const getLabelFilePath = async (): Promise<string> => {
  const response = await prompts(labelFilePath)
  return response.filePath
}
