// ============================================================================
// HitMeUp - Browser Console Logging Library
// ============================================================================

// ----------------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------------

type HitMeUpCSSPropertiesT = Partial<{
	color: string
	background: string
	backgroundColor: string
	fontWeight: string
	fontSize: string
	fontStyle: string
	padding: string
	margin: string
	borderRadius: string
	textDecoration: string
	textTransform: string
	letterSpacing: string
	lineHeight: string
	border: string
	[key: string]: string | undefined
}>

type HitMeUpLogLevelT = 'log' | 'info' | 'warn' | 'error' | 'debug'

type HitMeUpStyleConfigT = {
	labelPrefixStyles?: HitMeUpCSSPropertiesT
	labelStyles?: HitMeUpCSSPropertiesT
	messageStyles?: HitMeUpCSSPropertiesT
}

type HitMeUpLevelConfigT = HitMeUpStyleConfigT

type HitMeUpPresetConfigT = HitMeUpStyleConfigT & {
	level?: HitMeUpLogLevelT
	prefix?: string
	icon?: string
	extends?: string
}

type HitMeUpOptionsT = {
	isEnabled: boolean
	shouldDisableDefaultGlobalStyles: boolean
	shouldShowTimestamps: boolean
	timestampFormat: string
	shouldAggregate: boolean
	shouldShowCaller: boolean
	disabledPresets: string[]
	maxObjectDepth: number
}

type KeyValueObjectT = {
	[key: string]: any
}

type HitMeUpConfigT = {
	options?: Partial<HitMeUpOptionsT>
	tokens?: KeyValueObjectT
	levels?: Partial<Record<HitMeUpLogLevelT, HitMeUpLevelConfigT>>
	presets?: Record<string, HitMeUpPresetConfigT>
}

type HitMeUpStoreT = {
	options: HitMeUpOptionsT
	tokens: KeyValueObjectT
	presetConfigurations: Record<string, HitMeUpPresetConfigT>
	logLevelConfigurations: Record<string, HitMeUpStyleConfigT>
}

type FinalLogOptionsT = {
	level: HitMeUpLogLevelT
	prefix?: string
	label?: string
	icon?: string
	styles?: HitMeUpStyleConfigT
	logArgs: any[]
}

type ChainedLoggerT = {
	withIcon: (icon: string) => ChainedLoggerT
	withPrefix: (prefix: string) => ChainedLoggerT
	withLabel: (label: string) => ChainedLoggerT
	log: (...logArgs: any[]) => void
	info: (...logArgs: any[]) => void
	warn: (...logArgs: any[]) => void
	error: (...logArgs: any[]) => void
	debug: (...logArgs: any[]) => void
	[key: string]: any
}

type HitMeUpInstanceT = ChainedLoggerT & {
	configure: (config: HitMeUpConfigT) => void
	setOption: (key: keyof HitMeUpOptionsT, value: any) => void
	setOptions: (options: Partial<HitMeUpOptionsT>) => void
}

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const LOG_LEVELS: HitMeUpLogLevelT[] = ['log', 'info', 'warn', 'error', 'debug']

type HitMeUpSectionedStylesT = { labelStyles: HitMeUpCSSPropertiesT; messageStyles: HitMeUpCSSPropertiesT }

const DEFAULT_GLOBAL_STYLES: HitMeUpSectionedStylesT = {
	labelStyles: { border: '2px solid pink' },
	messageStyles: { border: '2px dashed pink' }
}

// ----------------------------------------------------------------------------
// Store Creation
// ----------------------------------------------------------------------------

const createStore = (): HitMeUpStoreT => {
	return {
		options: {
			isEnabled: true,
			shouldDisableDefaultGlobalStyles: false,
			shouldShowTimestamps: false,
			timestampFormat: 'HH:mm:ss',
			shouldAggregate: false,
			shouldShowCaller: false,
			disabledPresets: [],
			maxObjectDepth: 3
		},
		tokens: {
			white: '#FFFFFF',
			black: '#000000',
			red: '#FF0000',
			blue: '#0000FF',
			green: '#00FF00',
			yellow: '#FFFF00',
			orange: '#FFA500',
			purple: '#800080',
			gray: '#808080'
		},
		presetConfigurations: {},
		logLevelConfigurations: {
			global: DEFAULT_GLOBAL_STYLES,
			log: {},
			info: {},
			warn: {},
			error: {},
			debug: {}
		}
	}
}

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

const resolveTokensInString = (value: string, tokens: KeyValueObjectT): string => {
	let resolvedValue = value

	const tokenPattern = /\$(\w+)/g
	const matches = value.match(tokenPattern)

	if (!matches) {
		return resolvedValue
	}

	for (const match of matches) {
		const tokenName = match.slice(1)
		const tokenValue = tokens[tokenName]

		if (tokenValue !== undefined) {
			resolvedValue = resolvedValue.replace(match, tokenValue)
		}
	}

	return resolvedValue
}

const resolveTokensInStyles = (styles: HitMeUpCSSPropertiesT, tokens: KeyValueObjectT): HitMeUpCSSPropertiesT => {
	const resolvedStyles: HitMeUpCSSPropertiesT = {}

	const styleKeys = Object.keys(styles)

	for (const key of styleKeys) {
		const value = styles[key]

		if (value === undefined) {
			continue
		}

		// TODO: we are getting errors because we are receiving objects as value arg.
		// i.e { border: '1px solid $red' }... the fn is set up only to handle strings
		resolvedStyles[key] = resolveTokensInString(value, tokens)
	}

	return resolvedStyles
}

const cssPropertiesToString = (styles: HitMeUpCSSPropertiesT): string => {
	const parts: string[] = []
	const keys = Object.keys(styles)

	for (const key of keys) {
		const value = styles[key]

		if (value === undefined) {
			continue
		}

		const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
		parts.push(`${cssKey}: ${value}`)
	}

	return parts.join('; ')
}

const mergeStyles = (base: HitMeUpCSSPropertiesT, override: HitMeUpCSSPropertiesT): HitMeUpCSSPropertiesT => {
	return { ...base, ...override }
}

const isPresetDisabled = (presetName: string, disabledPresets: string[]): boolean => {
	if (disabledPresets.includes('*')) {
		return true
	}

	if (disabledPresets.includes(presetName)) {
		return true
	}

	return false
}

const resolvePresetConfig = (presetName: string, store: HitMeUpStoreT): HitMeUpPresetConfigT | null => {
	const presetConfig = store.presetConfigurations[presetName]

	if (!presetConfig) {
		return null
	}

	const hasExtends = presetConfig.extends !== undefined

	if (!hasExtends) {
		return presetConfig
	}

	const parentPresetName = presetConfig.extends as string
	const parentConfig = resolvePresetConfig(parentPresetName, store)

	if (!parentConfig) {
		return presetConfig
	}

	const mergedLabelPrefixStyles = mergeStyles(parentConfig.labelPrefixStyles || {}, presetConfig.labelPrefixStyles || {})

	const mergedLabelStyles = mergeStyles(parentConfig.labelStyles || {}, presetConfig.labelStyles || {})

	const mergedMessageStyles = mergeStyles(parentConfig.messageStyles || {}, presetConfig.messageStyles || {})

	return {
		level: presetConfig.level || parentConfig.level,
		prefix: presetConfig.prefix || parentConfig.prefix,
		icon: presetConfig.icon || parentConfig.icon,
		labelPrefixStyles: mergedLabelPrefixStyles,
		labelStyles: mergedLabelStyles,
		messageStyles: mergedMessageStyles
	}
}

// ----------------------------------------------------------------------------
// Core Logger Functions
// ----------------------------------------------------------------------------

const buildLabelText = (options: FinalLogOptionsT): string => {
	const parts: string[] = []

	const hasIcon = options.icon !== undefined
	const hasPrefix = options.prefix !== undefined
	const hasLabel = options.label !== undefined

	if (hasIcon) {
		parts.push(options.icon as string)
	}

	if (hasPrefix) {
		parts.push(options.prefix as string)
	}

	if (hasLabel) {
		parts.push(options.label as string)
	}

	const hasNoParts = parts.length === 0

	if (hasNoParts) {
		return ''
	}

	return parts.join(' ')
}

const buildFinalStyles = (
	options: FinalLogOptionsT,
	store: HitMeUpStoreT
): { labelStyles: string; messageStyles: string } => {
	const shouldUseGlobalStyles = !store.options.shouldDisableDefaultGlobalStyles

	const globalStyleConfig = store.logLevelConfigurations.global || {}
	const globalStyles = shouldUseGlobalStyles ? (globalStyleConfig as HitMeUpCSSPropertiesT) : {}

	const levelConfig = store.logLevelConfigurations[options.level] || {}

	const baseLabelStyles = mergeStyles(globalStyles, levelConfig.labelStyles || {})
	const baseMessageStyles = mergeStyles(globalStyles, levelConfig.messageStyles || {})

	const overrideLabelStyles = options.styles?.labelStyles || {}
	const overrideMessageStyles = options.styles?.messageStyles || {}

	const finalLabelStyles = mergeStyles(baseLabelStyles, overrideLabelStyles)
	const finalMessageStyles = mergeStyles(baseMessageStyles, overrideMessageStyles)

	const resolvedLabelStyles = resolveTokensInStyles(finalLabelStyles, store.tokens)
	const resolvedMessageStyles = resolveTokensInStyles(finalMessageStyles, store.tokens)

	const labelStyleString = cssPropertiesToString(resolvedLabelStyles)
	const messageStyleString = cssPropertiesToString(resolvedMessageStyles)

	return {
		labelStyles: labelStyleString,
		messageStyles: messageStyleString
	}
}

const sendMessage = (options: FinalLogOptionsT, store: HitMeUpStoreT): void => {
	const isDisabled = !store.options.isEnabled

	if (isDisabled) {
		return
	}

	const labelText = buildLabelText(options)
	const hasLabel = labelText.length > 0

	const styles = buildFinalStyles(options, store)

	const logLevel = options.level
	const consoleMethod = console[logLevel] || console.log

	if (!hasLabel) {
		consoleMethod(...options.logArgs)
		return
	}

	consoleMethod(`%c${labelText}%c`, styles.labelStyles, styles.messageStyles, ...options.logArgs)
}

// ----------------------------------------------------------------------------
// Configuration Functions
// ----------------------------------------------------------------------------

const mergeTokens = (store: HitMeUpStoreT, tokens: KeyValueObjectT): void => {
	const tokenKeys = Object.keys(tokens)

	for (const key of tokenKeys) {
		store.tokens[key] = tokens[key]
	}
}

const mergeOptions = (store: HitMeUpStoreT, options: Partial<HitMeUpOptionsT>): void => {
	const optionKeys = Object.keys(options) as (keyof HitMeUpOptionsT)[]

	for (const key of optionKeys) {
		const value = options[key]

		if (value !== undefined) {
			;(store.options[key] as any) = value
		}
	}
}

const applyLevelConfigs = (store: HitMeUpStoreT, levels: Partial<Record<HitMeUpLogLevelT, HitMeUpLevelConfigT>>): void => {
	const levelKeys = Object.keys(levels) as HitMeUpLogLevelT[]

	for (const level of levelKeys) {
		const levelConfig = levels[level]

		if (levelConfig === undefined) {
			continue
		}

		const existingConfig = store.logLevelConfigurations[level] || {}

		const mergedLabelPrefixStyles = mergeStyles(existingConfig.labelPrefixStyles || {}, levelConfig.labelPrefixStyles || {})

		const mergedLabelStyles = mergeStyles(existingConfig.labelStyles || {}, levelConfig.labelStyles || {})

		const mergedMessageStyles = mergeStyles(existingConfig.messageStyles || {}, levelConfig.messageStyles || {})

		store.logLevelConfigurations[level] = {
			labelPrefixStyles: mergedLabelPrefixStyles,
			labelStyles: mergedLabelStyles,
			messageStyles: mergedMessageStyles
		}
	}
}

const registerPresets = (store: HitMeUpStoreT, presets: Record<string, HitMeUpPresetConfigT>): void => {
	const presetNames = Object.keys(presets)

	for (const presetName of presetNames) {
		store.presetConfigurations[presetName] = presets[presetName]
	}
}

// ----------------------------------------------------------------------------
// Chained Logger Creation
// ----------------------------------------------------------------------------

const createChainedLogger = (store: HitMeUpStoreT, overrides: Partial<FinalLogOptionsT>): ChainedLoggerT => {
	const chainedLogger: any = {
		withIcon: (icon: string): ChainedLoggerT => {
			const newOverrides = { ...overrides, icon }
			return createChainedLogger(store, newOverrides)
		},

		withPrefix: (prefix: string): ChainedLoggerT => {
			const newOverrides = { ...overrides, prefix }
			return createChainedLogger(store, newOverrides)
		},

		withLabel: (label: string): ChainedLoggerT => {
			const newOverrides = { ...overrides, label }
			return createChainedLogger(store, newOverrides)
		}
	}

	for (const level of LOG_LEVELS) {
		chainedLogger[level] = (...logArgs: any[]): void => {
			const finalOptions: FinalLogOptionsT = {
				level,
				prefix: overrides.prefix,
				label: overrides.label,
				icon: overrides.icon,
				styles: overrides.styles,
				logArgs
			}

			sendMessage(finalOptions, store)
		}
	}

	const presetNames = Object.keys(store.presetConfigurations)

	for (const presetName of presetNames) {
		chainedLogger[presetName] = (...logArgs: any[]): void => {
			const isDisabled = isPresetDisabled(presetName, store.options.disabledPresets)

			if (isDisabled) {
				return
			}

			const resolvedPreset = resolvePresetConfig(presetName, store)

			if (!resolvedPreset) {
				return
			}

			const finalLevel = overrides.level || resolvedPreset.level || 'log'
			const finalPrefix = overrides.prefix || resolvedPreset.prefix
			const finalIcon = overrides.icon || resolvedPreset.icon
			const finalLabel = overrides.label

			const presetStyles: HitMeUpStyleConfigT = {
				labelPrefixStyles: resolvedPreset.labelPrefixStyles,
				labelStyles: resolvedPreset.labelStyles,
				messageStyles: resolvedPreset.messageStyles
			}

			const mergedLabelStyles = mergeStyles(presetStyles.labelStyles || {}, overrides.styles?.labelStyles || {})

			const mergedMessageStyles = mergeStyles(presetStyles.messageStyles || {}, overrides.styles?.messageStyles || {})

			const finalStyles: HitMeUpStyleConfigT = {
				labelPrefixStyles: presetStyles.labelPrefixStyles,
				labelStyles: mergedLabelStyles,
				messageStyles: mergedMessageStyles
			}

			const finalOptions: FinalLogOptionsT = {
				level: finalLevel,
				prefix: finalPrefix,
				label: finalLabel,
				icon: finalIcon,
				styles: finalStyles,
				logArgs
			}

			sendMessage(finalOptions, store)
		}
	}

	return chainedLogger
}

// ----------------------------------------------------------------------------
// Main Instance Creation
// ----------------------------------------------------------------------------

const createHitMeUp = (): HitMeUpInstanceT => {
	const store = createStore()

	const configure = (config: HitMeUpConfigT): void => {
		const hasTokens = config.tokens !== undefined
		const hasOptions = config.options !== undefined
		const hasLevels = config.levels !== undefined
		const hasPresets = config.presets !== undefined

		if (hasTokens) {
			mergeTokens(store, config.tokens!)
		}

		if (hasOptions) {
			mergeOptions(store, config.options!)
		}

		if (hasLevels) {
			applyLevelConfigs(store, config.levels!)
		}

		if (hasPresets) {
			registerPresets(store, config.presets!)
		}
	}

	const setOption = (key: keyof HitMeUpOptionsT, value: any): void => {
		;(store.options[key] as any) = value
	}

	const setOptions = (options: Partial<HitMeUpOptionsT>): void => {
		mergeOptions(store, options)
	}

	const baseLogger = createChainedLogger(store, {})

	const hmu = {
		...baseLogger,
		configure,
		setOption,
		setOptions
	} as HitMeUpInstanceT

	return hmu
}

export const hmu = createHitMeUp()

// ----------------------------------------------------------------------------
// Example Usage
// ----------------------------------------------------------------------------

/*

const hmu = createHitMeUp();

// Configure
hmu.configure({
  tokens: {
    brandBlue: '#0066CC',
  },
  levels: {
    error: {
      labelStyles: { backgroundColor: '$red', color: '$white' }
    }
  },
  presets: {
    api: {
      level: 'info',
      icon: '🌐',
      prefix: 'API',
      labelStyles: { backgroundColor: '$brandBlue', color: '$white' }
    }
  }
});

// Basic logging
hmu.log('Simple message');
hmu.error('Something broke!');

// With chaining
hmu.withIcon('🔥').withPrefix('ALERT').error('Critical!');

// Preset usage
hmu.api('Request completed');

// Chaining with presets
hmu.withLabel('v1').api('API ready');

*/
