import { llmService } from '../llm';

describe('LLMService', () => {
  const mockOpenAIKey = 'mock-openai-key';
  const mockAnthropicKey = 'mock-anthropic-key';

  beforeEach(() => {
    // Reset the service before each test
    llmService['openai'] = null;
    llmService['anthropic'] = null;
  });

  it('should set OpenAI key correctly', () => {
    llmService.setOpenAIKey(mockOpenAIKey);
    expect(llmService['openai']).not.toBeNull();
  });

  it('should set Anthropic key correctly', () => {
    llmService.setAnthropicKey(mockAnthropicKey);
    expect(llmService['anthropic']).not.toBeNull();
  });

  it('should return available models', () => {
    const openaiModels = llmService.getAvailableModels('openai');
    const anthropicModels = llmService.getAvailableModels('anthropic');

    expect(openaiModels).toContain('gpt-4o');
    expect(openaiModels).toContain('gpt-3.5-turbo');
    expect(anthropicModels).toContain('claude-3-5-sonnet-20241022');
    expect(anthropicModels).toContain('claude-2.1');
  });

  it('should throw error when no API key is set', async () => {
    await expect(llmService.generateResponse('openai', 'gpt-4o', [
      { role: 'user', content: 'test' }
    ])).rejects.toThrow('No API key set for openai');
  });
});
