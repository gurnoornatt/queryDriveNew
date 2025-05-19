import { v4 as uuidv4 } from 'uuid';
import { 
  WebhookStorageRecord, 
  WebhookProcessingResult, 
  WebhookProvider 
} from './types';
import { WebhookProcessorFactory } from './WebhookProcessorFactory';
import { WebhookStorage } from './WebhookStorage';

// Queue configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_INTERVALS = [
  1000 * 60,     // 1 minute
  1000 * 60 * 5, // 5 minutes
  1000 * 60 * 30 // 30 minutes
];

/**
 * Webhook queue for processing and retrying webhook events
 */
export class WebhookQueue {
  private static instance: WebhookQueue;
  private processingQueue: Map<string, NodeJS.Timeout> = new Map();
  private storage: WebhookStorage;

  /**
   * Get the singleton instance
   * @returns The WebhookQueue instance
   */
  static getInstance(): WebhookQueue {
    if (!WebhookQueue.instance) {
      WebhookQueue.instance = new WebhookQueue();
    }
    return WebhookQueue.instance;
  }

  /**
   * Create a new webhook queue
   */
  private constructor() {
    this.storage = WebhookStorage.getInstance();
    this.initializeRetryQueue();
  }

  /**
   * Initialize the retry queue with pending webhooks from storage
   */
  private initializeRetryQueue(): void {
    const pendingWebhooks = this.storage.getPendingWebhooks(MAX_RETRY_ATTEMPTS);
    
    console.log(`[Webhook Queue] Found ${pendingWebhooks.length} pending webhooks to retry`);
    
    for (const webhook of pendingWebhooks) {
      const retryDelay = 5000; // 5 seconds for initial retry, real delays in handleProcessingFailure
      
      console.log(`[Webhook Queue] Scheduling initial retry for webhook ${webhook.id} in ${retryDelay / 1000} seconds`);
      
      const timeout = setTimeout(() => {
        this.processWebhook(webhook.id, webhook.headers); // Pass stored headers
        this.processingQueue.delete(webhook.id);
      }, retryDelay);
      
      this.processingQueue.set(webhook.id, timeout);
    }
  }

  /**
   * Add a webhook to the queue
   * @param provider The webhook provider
   * @param rawData The raw webhook data
   * @param headers The request headers
   * @returns The webhook storage record ID
   */
  async addToQueue(
    provider: WebhookProvider | string, 
    rawData: any, 
    headers?: Record<string, string>
  ): Promise<string> {
    // Convert string provider to enum if needed
    const providerEnum = typeof provider === 'string' 
      ? WebhookProcessorFactory.getProcessorByName(provider) ? // Hack to get enum from name
        (provider.toLowerCase() === 'doordash' ? WebhookProvider.DOORDASH : WebhookProvider.UBER) 
        : WebhookProvider.UNKNOWN 
      : provider;

    // Store the webhook using WebhookStorage.storeWebhook
    const record = this.storage.storeWebhook(providerEnum, rawData, headers); // Pass headers to store

    // Process the webhook immediately
    this.processWebhook(record.id, record.headers);

    return record.id;
  }

  /**
   * Process a webhook
   * @param webhookId The webhook ID
   * @param headers The request headers
   */
  private async processWebhook(
    webhookId: string, 
    headers?: Record<string, string>
  ): Promise<void> {
    // Get the webhook record from storage
    const record = this.storage.getWebhook(webhookId);
    if (!record) {
      console.error(`[Webhook Queue] Webhook not found: ${webhookId}`);
      return;
    }

    // Prevent processing if already processed or max attempts reached
    if (record.status === 'processed' || record.processingAttempts >= MAX_RETRY_ATTEMPTS && record.status === 'failed') {
      console.log(`[Webhook Queue] Webhook ${webhookId} already ${record.status} or max attempts reached. Skipping.`);
      return;
    }

    console.log(`[Webhook Queue] Processing webhook ${webhookId}, attempt ${record.processingAttempts + 1}`);

    try {
      // Get the appropriate processor
      const processor = WebhookProcessorFactory.getProcessor(record.provider);

      // Process the webhook
      const result = await processor.processWebhook(record.rawData, headers);

      // Update the record with the result using WebhookStorage.updateWebhook
      this.storage.updateWebhook(webhookId, result);

      if (result.success) {
        console.log(`[Webhook Queue] Webhook processed successfully: ${webhookId}`);
      } else {
        // Handle processing failure (will be logged by updateWebhook and retried if applicable)
        console.warn(`[Webhook Queue] Webhook processing attempt failed for ${webhookId}: ${result.message}`);
        this.handleProcessingFailure(webhookId, record, result); // Ensure retry logic is called
      }
    } catch (error) {
      // Handle processing error
      const result: WebhookProcessingResult = {
        success: false,
        message: `[Webhook Queue] Error processing webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
      // Update storage with failure and attempt retry
      this.storage.updateWebhook(webhookId, result);
      this.handleProcessingFailure(webhookId, record, result);
    }
  }

  /**
   * Handle a webhook processing failure
   * @param webhookId The webhook ID
   * @param record The webhook record (before update from current attempt)
   * @param result The processing result of the current attempt
   */
  private handleProcessingFailure(
    webhookId: string, 
    record: WebhookStorageRecord, // This is the record *before* the current attempt's update
    currentAttemptResult: WebhookProcessingResult
  ): void {
    // Fetch the *updated* record from storage to get the correct processingAttempts count
    const updatedRecord = this.storage.getWebhook(webhookId);
    if (!updatedRecord) {
        console.error(`[Webhook Queue] Failed to retrieve updated record for ${webhookId} after failure.`);
        return;
    }

    console.warn(`[Webhook Queue] Handling failure for webhook ${webhookId}. Attempt ${updatedRecord.processingAttempts}. Message: ${currentAttemptResult.message}`);

    // Check if we should retry (based on the updated record's attempt count)
    if (updatedRecord.status === 'pending' && updatedRecord.processingAttempts < MAX_RETRY_ATTEMPTS) {
      const retryIndex = Math.min(updatedRecord.processingAttempts -1, RETRY_INTERVALS.length - 1);
      const retryDelay = RETRY_INTERVALS[retryIndex];

      console.log(`[Webhook Queue] Scheduling retry ${updatedRecord.processingAttempts +1} for webhook ${webhookId} in ${retryDelay / 1000} seconds`);

      // Clear any existing timeout
      if (this.processingQueue.has(webhookId)) {
        clearTimeout(this.processingQueue.get(webhookId)!);
      }

      // Schedule retry
      const timeout = setTimeout(() => {
        this.processWebhook(webhookId, updatedRecord.headers); // Pass stored headers for retry
        this.processingQueue.delete(webhookId);
      }, retryDelay);

      // Store the timeout
      this.processingQueue.set(webhookId, timeout);
    } else {
      console.error(`[Webhook Queue] Webhook processing failed permanently for ${webhookId} after ${updatedRecord.processingAttempts} attempts.`);
      // The status should have been set to 'failed' by updateWebhook in WebhookStorage
    }
  }

  /**
   * Get all webhook records from storage
   * @returns All webhook records
   */
  getAllWebhooks(): WebhookStorageRecord[] {
    return this.storage.getAllWebhooks();
  }

  /**
   * Get a webhook record by ID from storage
   * @param id The webhook ID
   * @returns The webhook record
   */
  getWebhook(id: string): WebhookStorageRecord | undefined {
    return this.storage.getWebhook(id);
  }

  /**
   * Get webhook records by provider from storage
   * @param provider The webhook provider
   * @returns Webhook records for the provider
   */
  getWebhooksByProvider(provider: WebhookProvider | string): WebhookStorageRecord[] {
    const providerEnum = typeof provider === 'string' 
      ? WebhookProcessorFactory.getProcessorByName(provider) ? // Hack to get enum from name
        (provider.toLowerCase() === 'doordash' ? WebhookProvider.DOORDASH : WebhookProvider.UBER) 
        : WebhookProvider.UNKNOWN
      : provider;

    return this.storage.getWebhooksByProvider(providerEnum);
  }
} 