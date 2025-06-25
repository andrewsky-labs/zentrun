import { ModelConfig } from '@shared/presenter'

// 定义每个provider的模型匹配规则和配置的接口，与modelDefaultSettings保持一致的风格
export interface ProviderModelSetting {
  id: string // 模型ID
  name: string // 模型名称
  match: string[] // 用于匹配模型ID的字符串数组
  maxTokens: number // 最大生成token数
  contextLength: number // 上下文长度
  temperature?: number // 温度参数
  vision?: boolean // 是否支持视觉
  functionCall?: boolean // 是否支持函数调用
  reasoning?: boolean // 是否支持推理能力
}

// 为每个提供商创建映射对象，使用models数组包装模型配置
export const providerModelSettings: Record<string, { models: ProviderModelSetting[] }> = {
  // OpenAI提供商特定模型配置
  openai: {
    models: []
  },

  // 火山引擎(Doubao)提供商特定模型配置
  doubao: {
    models: []
  },

  // Anthropic提供商特定模型配置
  anthropic: {
    models: [
      {
        id: 'claude-3-7-sonnet',
        name: 'Claude 3.7 Sonnet',
        temperature: 1,
        maxTokens: 64000,
        contextLength: 204800,
        match: ['claude-3-7-sonnet', 'claude-3.7-sonnet'],
        vision: true,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 204800,
        match: ['claude-3-5-sonnet', 'claude-3.5-sonnet'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        temperature: 0.7,
        maxTokens: 4096,
        contextLength: 204800,
        match: ['claude-3-opus', 'claude-3.opus'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        temperature: 0.7,
        maxTokens: 4096,
        contextLength: 204800,
        match: ['claude-3-haiku', 'claude-3.haiku', 'claude-3-5-haiku', 'claude-3.5-haiku'],
        vision: true,
        functionCall: true,
        reasoning: false
      }
    ]
  },

  // Gemini提供商特定模型配置
  gemini: {
    models: [
      {
        id: 'models/gemini-2.5-flash-preview-04-17',
        name: 'Gemini 2.5 Flash Preview',
        temperature: 0.7,
        maxTokens: 65536,
        contextLength: 1048576,
        match: ['models/gemini-2.5-flash-preview-04-17', 'gemini-2.5-flash-preview-04-17'],
        vision: true,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'gemini-2.5-pro-preview-05-06',
        name: 'Gemini 2.5 Pro Preview 05-06',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 2048576,
        match: ['gemini-2.5-pro-preview'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-2.5-pro-exp-03-25',
        name: 'Gemini 2.5 Pro Exp 03-25',
        temperature: 0.7,
        maxTokens: 65536,
        contextLength: 2048576,
        match: ['gemini-2.5-pro-exp-03-25'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-2.0-flash-exp-image-generation',
        name: 'Gemini 2.0 Flash Exp Image Generation',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 1048576,
        match: ['gemini-2.0-flash-exp-image-generation'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-2.0-pro-exp-02-05',
        name: 'Gemini 2.0 Pro Exp 02-05',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 2048576,
        match: ['gemini-2.0-pro-exp-02-05'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 1048576,
        match: ['gemini-2.0-flash'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 1048576,
        match: ['gemini-1.5-flash'],
        vision: true,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        temperature: 0.7,
        maxTokens: 8192,
        contextLength: 2097152,
        match: ['gemini-1.5-pro'],
        vision: true,
        functionCall: true,
        reasoning: false
      }
    ]
  },

  // 华为云Hunyuan提供商特定模型配置
  hunyuan: {
    models: []
  },

  // DeepSeek提供商特定模型配置
  deepseek: {
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek chat',
        temperature: 1,
        maxTokens: 8192,
        contextLength: 65536,
        match: ['deepseek-chat'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 65536,
        match: ['deepseek-reasoner'],
        vision: false,
        functionCall: false,
        reasoning: true
      }
    ]
  },

  // MiniMax提供商特定模型配置
  minimax: {
    models: []
  },

  // 智谱AI提供商特定模型配置
  zhipu: {
    models: []
  },

  // Moonshot提供商特定模型配置
  moonshot: {
    models: []
  },

  // Ollama提供商特定模型配置
  ollama: {
    models: [
      {
        id: 'qwen3:0.6b',
        name: 'Qwen3 0.6B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:0.6b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:1.7b',
        name: 'Qwen3 1.7B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:1.7b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:4b',
        name: 'Qwen3 4B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:4b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:8b',
        name: 'Qwen3 8B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:8b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:14b',
        name: 'Qwen3 14B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:14b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:32b',
        name: 'Qwen3 32B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:32b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:30b-a3b',
        name: 'Qwen3 30B A3B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:30b-a3b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'qwen3:235b-a22b',
        name: 'Qwen3 235B A22B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3:235b-a22b'],
        vision: false,
        functionCall: true,
        reasoning: true
      }
    ]
  },

  // 七牛云提供商特定模型配置
  qiniu: {
    models: []
  },

  // Silicon Flow提供商特定模型配置
  silicon: {
    models: [
      {
        id: 'Qwen/Qwen3-235B-A22B',
        name: 'Qwen/Qwen3-235B-A22B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 100_000,
        match: ['qwen3-235b-a22b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'Qwen/Qwen3-30B-A3B',
        name: 'Qwen/Qwen3-30B-A3B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 100_000,
        match: ['qwen3-30b-a3b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'Qwen/Qwen3-32B',
        name: 'Qwen/Qwen3-32B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 100_000,
        match: ['qwen3-32b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'Qwen/Qwen3-14B',
        name: 'Qwen/Qwen3-14B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 100_000,
        match: ['qwen3-14b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'Qwen/Qwen3-8B',
        name: 'Qwen/Qwen3-8B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 100_000,
        match: ['qwen3-8b'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'Pro/deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek V3 Pro',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['pro/deepseek-ai/deepseek-v3'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'Pro/deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek R1 Pro',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['pro/deepseek-ai/deepseek-r1'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek V3',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['deepseek-ai/deepseek-v3'],
        vision: false,
        functionCall: false,
        reasoning: false
      },
      {
        id: 'deepseek-ai/DeepSeek-R1',
        name: 'DeepSeek R1',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['deepseek-ai/deepseek-r1'],
        vision: false,
        functionCall: false,
        reasoning: true
      }
    ]
  },

  // Fireworks提供商特定模型配置
  fireworks: {
    models: []
  },

  // PPIO提供商特定模型配置
  ppio: {
    models: [
      {
        id: 'qwen/qwen3-235b-a22b-fp8',
        name: 'Qwen/Qwen3-235B-A22B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3-235b-a22b-fp8', 'qwen3-235b-a22b'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'qwen/qwen3-30b-a3b-fp8',
        name: 'Qwen/Qwen3-30B-A3B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3-30b-a3b-fp8', 'qwen3-30b-a3b'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'qwen/qwen3-30b-a3b-fp8',
        name: 'Qwen/Qwen3-30B-A3B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3-30b-a3b-fp8', 'qwen3-30b-a3b'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'qwen/qwen3-32b-fp8',
        name: 'Qwen/Qwen3-32B',
        temperature: 0.6,
        maxTokens: 8192,
        contextLength: 40960,
        match: ['qwen3-32b-fp8', 'qwen3-32b'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'deepseek/deepseek-prover-v2-671b',
        name: 'Deepseek Prover V2 671B',
        temperature: 0.3,
        maxTokens: 10000,
        contextLength: 150000,
        match: ['deepseek-prover-v2-671b'],
        vision: false,
        functionCall: false,
        reasoning: true
      },
      {
        id: 'deepseek/deepseek-v3-0324',
        name: 'DeepSeek Chat v3 0324',
        temperature: 0.6,
        maxTokens: 10000,
        contextLength: 110_000,
        match: ['deepseek-chat-v3-0324'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'deepseek/deepseek-r1-turbo',
        name: 'DeepSeek R1 Turbo',
        temperature: 0.6,
        maxTokens: 10000,
        contextLength: 50000,
        match: ['deepseek-r1-turbo'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'deepseek/deepseek-v3-turbo',
        name: 'DeepSeek V3 Turbo',
        temperature: 0.6,
        maxTokens: 10000,
        contextLength: 50000,
        match: ['deepseek-v3-turbo'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'deepseek/deepseek-v3/community',
        name: 'DeepSeek V3 Community',
        temperature: 0.6,
        maxTokens: 3200,
        contextLength: 62000,
        match: ['deepseek-v3/community'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'deepseek/deepseek-r1/community',
        name: 'DeepSeek R1 Community',
        temperature: 0.6,
        maxTokens: 3200,
        contextLength: 62000,
        match: ['deepseek-r1/community'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'deepseek/deepseek-v3',
        name: 'DeepSeek V3',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['deepseek-v3'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        temperature: 0.6,
        maxTokens: 7000,
        contextLength: 62000,
        match: ['deepseek-r1'],
        vision: false,
        functionCall: true,
        reasoning: true
      }
    ]
  },

  // GitHub提供商特定模型配置
  github: {
    models: []
  },

  // 阿里云提供商特定模型配置
  dashscope: {
    models: []
  },

  // Zentrun提供商特定模型配置
  zentrun: {
    models: []
  },

  // OpenRouter提供商特定模型配置
  openrouter: {
    models: []
  },

  // Grok提供商特定模型配置
  grok: {
    models: [
      {
        id: 'grok-3-mini-fast-beta',
        name: 'Grok 3 Mini Fast Beta',
        temperature: 1,
        contextLength: 120000,
        maxTokens: 100_000,
        match: ['grok-3-mini-fast', 'grok-3-mini-fast-latest', 'grok-3-mini-fast-beta'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'grok-3-mini-beta',
        name: 'Grok 3 Mini Beta',
        temperature: 1,
        contextLength: 120000,
        maxTokens: 100_000,
        match: ['grok-3-mini', 'grok-3-mini-latest', 'grok-3-mini-beta'],
        vision: false,
        functionCall: true,
        reasoning: true
      },
      {
        id: 'grok-3-fast-beta',
        name: 'Grok 3 Fast Beta',
        temperature: 0.7,
        contextLength: 120000,
        maxTokens: 100_000,
        match: ['grok-3-fast', 'grok-3-fast-latest', 'grok-3-fast-beta'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'grok-2-vision-1212',
        name: 'Grok 2 Vision 1212',
        temperature: 0.7,
        contextLength: 32000,
        maxTokens: 32000,
        match: ['grok-2-vision', 'grok-2-vision-latest', 'grok-2-vision-1212'],
        vision: true,
        functionCall: false,
        reasoning: false
      },
      {
        id: 'grok-2-image-1212',
        name: 'Grok 2 Image 1212',
        temperature: 0.7,
        contextLength: 130_000,
        maxTokens: 100_000,
        match: ['grok-2-image', 'grok-2-image-latest', 'grok-2-image-1212'],
        vision: true,
        functionCall: false,
        reasoning: false
      },
      {
        id: 'grok-3-beta',
        name: 'Grok 3 Beta',
        temperature: 0.7,
        contextLength: 120000,
        maxTokens: 100_000,
        match: ['grok-3', 'grok-3-latest', 'grok-3-beta'],
        vision: false,
        functionCall: true,
        reasoning: false
      },
      {
        id: 'grok-2-1212',
        name: 'Grok 2 1212',
        contextLength: 120000,
        temperature: 0.7,
        maxTokens: 100_000,
        match: ['grok-2', 'grok-2-latest', 'grok-2-1212'],
        vision: false,
        functionCall: true,
        reasoning: false
      }
    ]
  },

  // Azure OpenAI提供商特定模型配置
  'azure-openai': {
    models: []
  }
}

/**
 * 根据提供商ID和模型ID获取特定提供商的模型配置
 * @param providerId 提供商ID
 * @param modelId 模型ID
 * @returns ModelConfig | undefined 如果找到配置则返回，否则返回undefined
 */
export function getProviderSpecificModelConfig(
  providerId: string,
  modelId: string
): ModelConfig | undefined {
  // 将modelId转为小写以进行不区分大小写的匹配
  const lowerModelId = modelId.toLowerCase()

  // 检查该提供商是否存在特定配置
  const providerSetting = providerModelSettings[providerId]
  if (!providerSetting || !providerSetting.models) {
    return undefined
  }

  // 遍历该提供商的模型数组，查找匹配的模型配置
  for (const config of providerSetting.models) {
    // 检查是否有任何匹配条件符合
    if (config.match.some((matchStr) => lowerModelId.includes(matchStr.toLowerCase()))) {
      return {
        maxTokens: config.maxTokens,
        contextLength: config.contextLength,
        temperature: config.temperature || 0.7,
        vision: config.vision || false,
        functionCall: config.functionCall || false,
        reasoning: config.reasoning || false
      }
    }
  }

  // 如果没有找到匹配的配置，返回undefined
  return undefined
}
