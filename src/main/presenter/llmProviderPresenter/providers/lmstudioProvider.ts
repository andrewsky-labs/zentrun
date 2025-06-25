import { LLM_PROVIDER } from '@shared/presenter'
import { OpenAICompatibleProvider } from './openAICompatibleProvider'
import { ConfigPresenter } from '../../configPresenter'
export class LMStudioProvider extends OpenAICompatibleProvider {
  constructor(provider: LLM_PROVIDER, configPresenter: ConfigPresenter) {
    super(provider, configPresenter)
  }
}
