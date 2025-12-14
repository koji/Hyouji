import prompts from 'prompts'

import { newLabel } from '../constant.js'
import { ImportLabelType } from '../types/index.js'

export const getNewLabel = async (): Promise<ImportLabelType> => {
  const response = await prompts(newLabel)
  // console.log(response);
  return response
}
