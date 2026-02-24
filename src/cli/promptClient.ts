import { stdin as input, stdout as output } from 'node:process'
import { emitKeypressEvents } from 'node:readline'
import { createInterface } from 'node:readline/promises'

type OpenTuiModule = {
  createCliRenderer: (
    options?: Record<string, unknown>,
  ) => Promise<OpenTuiRenderer>
  BoxRenderable: OpenTuiRenderableConstructor
  TextRenderable: OpenTuiRenderableConstructor
  InputRenderable: OpenTuiRenderableConstructor
  SelectRenderable: OpenTuiRenderableConstructor
  InputRenderableEvents: { CHANGE: string }
  SelectRenderableEvents: { ITEM_SELECTED: string }
}

type OpenTuiRenderer = {
  root: OpenTuiRenderable
  destroy: () => Promise<void> | void
  keyInput?: {
    on?: (event: string, listener: (...args: unknown[]) => void) => void
  }
}

type OpenTuiRenderable = {
  add: (child: OpenTuiRenderable) => void
  focus?: () => void
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  setValue?: (value: string) => void
}

type OpenTuiRenderableConstructor = new (
  renderer: OpenTuiRenderer,
  options?: Record<string, unknown>,
) => OpenTuiRenderable

type SelectChoice = {
  title: string
  value: number
}

let opentuiLoadAttempted = false
let opentuiModule: OpenTuiModule | null = null

const loadOpenTui = async (): Promise<OpenTuiModule | null> => {
  if (opentuiLoadAttempted) {
    return opentuiModule
  }
  opentuiLoadAttempted = true

  try {
    const loaded = (await import('@opentui/core')) as unknown as OpenTuiModule
    opentuiModule = loaded
    return loaded
  } catch {
    opentuiModule = null
    return null
  }
}

const question = async (message: string): Promise<string> => {
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(`${message}: `)
    return answer.trim()
  } finally {
    rl.close()
  }
}

export const askText = async (
  message: string,
  options: { initial?: string } = {},
): Promise<string> => {
  const core = await loadOpenTui()
  if (core) {
    const result = await askTextWithOpenTui(core, message, options)
    if (result !== null) {
      return result
    }
  }

  const answer = await question(message)
  if (answer.length === 0 && options.initial !== undefined) {
    return options.initial
  }
  return answer
}

export const askPassword = async (message: string): Promise<string> => {
  return askText(message)
}

export const askConfirm = async (
  message: string,
  initial = true,
): Promise<boolean> => {
  const value = await askSelect(message, [
    { title: initial ? 'yes (default)' : 'yes', value: 1 },
    { title: initial ? 'no' : 'no (default)', value: 0 },
  ])
  if (value === 1) {
    return true
  }
  if (value === 0) {
    return false
  }
  return initial
}

export const askSelect = async (
  message: string,
  choices: readonly SelectChoice[],
): Promise<number> => {
  const core = await loadOpenTui()
  if (core) {
    const selected = await askSelectWithOpenTui(core, message, choices)
    if (selected !== null) {
      return selected
    }
  }

  output.write(`${message}\n`)
  choices.forEach((choice, index) => {
    output.write(`  ${index + 1}. ${choice.title}\n`)
  })

  const rawSelected = await askSelectWithRawInput(choices)
  if (rawSelected !== null) {
    return rawSelected
  }

  while (true) {
    const answer = await question('Select number')
    const normalized = answer.toLowerCase()
    if (normalized === 'esc' || normalized === 'escape') {
      return (
        choices.find((choice) => choice.title.toLowerCase() === 'exit')
          ?.value ?? 99
      )
    }

    const parsed = Number.parseInt(answer, 10)
    if (Number.isNaN(parsed)) {
      output.write('Please enter a valid number.\n')
      continue
    }
    const choice = choices[parsed - 1]
    if (!choice) {
      output.write('Out of range. Try again.\n')
      continue
    }
    return choice.value
  }
}

const askSelectWithOpenTui = async (
  core: OpenTuiModule,
  message: string,
  choices: readonly SelectChoice[],
): Promise<number | null> => {
  const renderer = await core.createCliRenderer({ exitOnCtrlC: true })
  let destroyed = false

  const destroyRenderer = async () => {
    if (destroyed) {
      return
    }
    destroyed = true
    await renderer.destroy()
  }

  try {
    const root = new core.BoxRenderable(renderer, {
      id: 'prompt-root',
      flexDirection: 'column',
      border: true,
      padding: 1,
    })
    const title = new core.TextRenderable(renderer, {
      id: 'prompt-title',
      content: message,
    })
    const select = new core.SelectRenderable(renderer, {
      id: 'prompt-select',
      options: choices.map((choice) => ({
        name: choice.title,
        value: choice.value,
      })),
    })

    root.add(title)
    root.add(select)
    renderer.root.add(root)

    select.focus?.()

    const escapeValue =
      choices.find((choice) => choice.title.toLowerCase() === 'exit')?.value ??
      99

    return await new Promise<number>((resolve) => {
      let resolved = false
      const resolveOnce = async (value: number) => {
        if (resolved) {
          return
        }
        resolved = true
        await destroyRenderer()
        resolve(value)
      }

      select.on?.(
        core.SelectRenderableEvents.ITEM_SELECTED,
        async (_index: unknown, option: unknown) => {
          if (
            typeof option === 'object' &&
            option !== null &&
            'value' in option &&
            typeof option.value === 'number'
          ) {
            await resolveOnce(option.value)
            return
          }
          await resolveOnce(99)
        },
      )

      renderer.keyInput?.on?.('keypress', async (key: unknown) => {
        if (
          typeof key === 'object' &&
          key !== null &&
          'name' in key &&
          (key.name === 'escape' || key.name === 'esc')
        ) {
          await resolveOnce(escapeValue)
        }
      })
    })
  } catch {
    await destroyRenderer()
    return null
  }
}

const askSelectWithRawInput = async (
  choices: readonly SelectChoice[],
): Promise<number | null> => {
  if (!input.isTTY || typeof input.setRawMode !== 'function') {
    return null
  }

  const escapeValue =
    choices.find((choice) => choice.title.toLowerCase() === 'exit')?.value ?? 99

  output.write('Select number (or Esc to exit): ')

  return await new Promise<number>((resolve) => {
    let digits = ''
    const wasRaw = input.isRaw

    const cleanup = () => {
      input.removeListener('keypress', onKeypress)
      if (!wasRaw) {
        input.setRawMode(false)
      }
      output.write('\n')
    }

    const resolveValue = (value: number) => {
      cleanup()
      resolve(value)
    }

    const onKeypress = (str: string, key: { name?: string }) => {
      if (key.name === 'escape' || key.name === 'esc') {
        resolveValue(escapeValue)
        return
      }

      if (key.name === 'return' || key.name === 'enter') {
        const parsed = Number.parseInt(digits, 10)
        if (Number.isNaN(parsed)) {
          output.write('\nPlease enter a valid number.\nSelect number: ')
          digits = ''
          return
        }
        const choice = choices[parsed - 1]
        if (!choice) {
          output.write('\nOut of range. Try again.\nSelect number: ')
          digits = ''
          return
        }
        resolveValue(choice.value)
        return
      }

      if (key.name === 'backspace') {
        if (digits.length > 0) {
          digits = digits.slice(0, -1)
          output.write('\b \b')
        }
        return
      }

      if (/^[0-9]$/.test(str)) {
        digits += str
        output.write(str)
      }
    }

    emitKeypressEvents(input)
    input.setRawMode(true)
    input.resume()
    input.on('keypress', onKeypress)
  })
}

const askTextWithOpenTui = async (
  core: OpenTuiModule,
  message: string,
  options: { initial?: string },
): Promise<string | null> => {
  const renderer = await core.createCliRenderer({ exitOnCtrlC: true })
  let destroyed = false
  let currentValue = options.initial ?? ''

  const destroyRenderer = async () => {
    if (destroyed) {
      return
    }
    destroyed = true
    await renderer.destroy()
  }

  try {
    const root = new core.BoxRenderable(renderer, {
      id: 'prompt-root',
      flexDirection: 'column',
      border: true,
      padding: 1,
    })
    const title = new core.TextRenderable(renderer, {
      id: 'prompt-title',
      content: message,
    })
    const inputField = new core.InputRenderable(renderer, {
      id: 'prompt-input',
      placeholder: options.initial ?? '',
    })

    inputField.setValue?.(currentValue)
    inputField.on?.(core.InputRenderableEvents.CHANGE, (nextValue: unknown) => {
      if (typeof nextValue === 'string') {
        currentValue = nextValue
      }
    })

    root.add(title)
    root.add(inputField)
    renderer.root.add(root)
    inputField.focus?.()

    return await new Promise<string>((resolve) => {
      renderer.keyInput?.on?.('keypress', async (key: unknown) => {
        if (
          typeof key === 'object' &&
          key !== null &&
          'name' in key &&
          (key.name === 'enter' || key.name === 'return')
        ) {
          await destroyRenderer()
          if (currentValue === '' && options.initial !== undefined) {
            resolve(options.initial)
            return
          }
          resolve(currentValue)
        }
      })
    })
  } catch {
    await destroyRenderer()
    return null
  }
}
