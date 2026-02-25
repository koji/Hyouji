import { holdToken } from '../constant.js'
import { askConfirm } from './promptClient.js'

export const getConfirmation = async (): Promise<boolean> => {
  return askConfirm(holdToken.message, holdToken.initial)
}
