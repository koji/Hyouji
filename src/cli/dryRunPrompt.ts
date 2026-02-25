import { dryRunToggle } from '../constant.js'
import { askConfirm } from './promptClient.js'

export const getDryRunChoice = async (): Promise<boolean> => {
  return askConfirm(dryRunToggle.message, dryRunToggle.initial)
}
