import { actionSelector } from '../constant.js'
import { askSelect } from './promptClient.js'

export const selectAction = async (): Promise<number> => {
  return askSelect(actionSelector.message, actionSelector.choices)
}
