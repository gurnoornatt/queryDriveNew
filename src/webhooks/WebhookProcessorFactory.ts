import { WebhookProcessor, WebhookProvider } from './types';
import { DoorDashWebhookProcessor } from './DoorDashWebhookProcessor';
import { UberWebhookProcessor } from './UberWebhookProcessor';

/**
 * Factory for creating webhook processors
 */
export class WebhookProcessorFactory {
  private static processors: Map<WebhookProvider, WebhookProcessor> = new Map();

  /**
   * Get a webhook processor for a provider
   * @param provider The webhook provider
   * @returns The webhook processor
   */
  static getProcessor(provider: WebhookProvider): WebhookProcessor {
    // Check if processor already exists
    if (this.processors.has(provider)) {
      return this.processors.get(provider)!;
    }

    // Create new processor based on provider
    let processor: WebhookProcessor;
    switch (provider) {
      case WebhookProvider.DOORDASH:
        processor = new DoorDashWebhookProcessor();
        break;
      case WebhookProvider.UBER:
        processor = new UberWebhookProcessor();
        break;
      default:
        throw new Error(`Unsupported webhook provider: ${provider}`);
    }

    // Cache processor for future use
    this.processors.set(provider, processor);
    return processor;
  }

  /**
   * Get a webhook processor by provider name
   * @param providerName The name of the webhook provider
   * @returns The webhook processor
   */
  static getProcessorByName(providerName: string): WebhookProcessor {
    const normalizedName = providerName.toLowerCase();
    
    switch (normalizedName) {
      case 'doordash':
        return this.getProcessor(WebhookProvider.DOORDASH);
      case 'uber':
        return this.getProcessor(WebhookProvider.UBER);
      default:
        throw new Error(`Unsupported webhook provider: ${providerName}`);
    }
  }
} 