import fs from 'fs';
import path from 'path';
import { WebhookStorageRecord, WebhookProvider, WebhookProcessingResult } from './types';

/**
 * Simple file-based webhook storage system
 * In a production environment, this would be replaced with a database
 */
export class WebhookStorage {
  private static instance: WebhookStorage;
  private storagePath: string;
  private webhooks: WebhookStorageRecord[] = [];
  private initialized: boolean = false;

  /**
   * Get the singleton instance
   * @returns The WebhookStorage instance
   */
  static getInstance(): WebhookStorage {
    if (!WebhookStorage.instance) {
      WebhookStorage.instance = new WebhookStorage();
    }
    return WebhookStorage.instance;
  }

  /**
   * Create a new webhook storage
   * @param storagePath Path to store webhook data
   */
  private constructor(storagePath: string = path.join(process.cwd(), 'data', 'webhooks')) {
    this.storagePath = storagePath;
    this.init();
  }

  /**
   * Initialize the storage
   */
  private init(): void {
    if (this.initialized) {
      return;
    }

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    // Load existing webhooks from storage
    this.loadWebhooks();

    this.initialized = true;
  }

  /**
   * Load webhooks from storage
   */
  private loadWebhooks(): void {
    try {
      // Get all webhook files
      const files = fs.readdirSync(this.storagePath);

      // Load each webhook
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storagePath, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const webhook = JSON.parse(data) as WebhookStorageRecord;
          
          // Convert dates from strings back to Date objects
          webhook.receivedAt = new Date(webhook.receivedAt);
          if (webhook.processedAt) {
            webhook.processedAt = new Date(webhook.processedAt);
          }
          if (webhook.lastProcessingAttempt) {
            webhook.lastProcessingAttempt = new Date(webhook.lastProcessingAttempt);
          }
          
          this.webhooks.push(webhook);
        }
      }

      console.log(`Loaded ${this.webhooks.length} webhooks from storage`);
    } catch (error) {
      console.error('Error loading webhooks from storage:', error);
    }
  }

  /**
   * Save a webhook to storage
   * @param webhook The webhook to save
   */
  async saveWebhook(webhook: WebhookStorageRecord): Promise<void> {
    // Store in memory
    this.webhooks.push(webhook);

    // Save to file
    try {
      const filePath = path.join(this.storagePath, `${webhook.id}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(webhook, null, 2));
    } catch (error) {
      console.error(`Error saving webhook ${webhook.id}:`, error);
    }
  }

  /**
   * Get a webhook by ID
   * @param id The webhook ID
   * @returns The webhook
   */
  getWebhook(id: string): WebhookStorageRecord | undefined {
    return this.webhooks.find(w => w.id === id);
  }

  /**
   * Get all webhooks
   * @returns All webhooks
   */
  getAllWebhooks(): WebhookStorageRecord[] {
    return this.webhooks;
  }

  /**
   * Get webhooks by provider
   * @param provider The webhook provider
   * @returns Webhooks for the provider
   */
  getWebhooksByProvider(provider: WebhookProvider): WebhookStorageRecord[] {
    return this.webhooks.filter(webhook => webhook.provider === provider);
  }

  /**
   * Get webhooks by status
   * @param status The webhook status
   * @returns Webhooks with the status
   */
  getWebhooksByStatus(status: 'pending' | 'processed' | 'failed'): WebhookStorageRecord[] {
    return this.webhooks.filter(webhook => webhook.status === status);
  }

  /**
   * Delete a webhook
   * @param id The webhook ID
   * @returns Whether the webhook was deleted
   */
  async deleteWebhook(id: string): Promise<boolean> {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) {
      return false;
    }

    // Remove from memory
    this.webhooks.splice(index, 1);

    // Delete file
    try {
      const filePath = path.join(this.storagePath, `${id}.json`);
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting webhook ${id}:`, error);
      return false;
    }
  }

  /**
   * Clear all webhooks
   */
  async clearAllWebhooks(): Promise<void> {
    // Clear memory
    this.webhooks = [];

    // Delete all files
    try {
      const files = fs.readdirSync(this.storagePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.promises.unlink(path.join(this.storagePath, file));
        }
      }
    } catch (error) {
      console.error('Error clearing webhooks:', error);
    }
  }

  /**
   * Store a new webhook
   * @param provider The webhook provider
   * @param rawData The raw webhook data
   * @param headers Optional headers for the webhook
   * @returns The stored webhook record
   */
  public storeWebhook(provider: WebhookProvider, rawData: any, headers?: Record<string, string>): WebhookStorageRecord {
    const webhook: WebhookStorageRecord = {
      id: `webhook-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      receivedAt: new Date(),
      processingAttempts: 0,
      status: 'pending',
      rawData,
      headers
    };

    this.webhooks.push(webhook);
    return webhook;
  }

  /**
   * Update a webhook record with processing results
   * @param id The webhook ID
   * @param result The processing result
   * @returns The updated webhook record or undefined if not found
   */
  public updateWebhook(id: string, result: WebhookProcessingResult): WebhookStorageRecord | undefined {
    const webhook = this.webhooks.find(w => w.id === id);
    if (!webhook) {
      return undefined;
    }

    webhook.processingAttempts += 1;
    webhook.lastProcessingAttempt = new Date();
    
    if (result.success) {
      webhook.status = 'processed';
      webhook.processedAt = new Date();
    } else if (webhook.processingAttempts >= 3) {
      webhook.status = 'failed';
    }
    
    webhook.processingResult = result;
    return webhook;
  }

  /**
   * Get all webhook records
   * @param provider Optional provider to filter by
   * @param status Optional status to filter by
   * @returns Array of webhook records
   */
  public getWebhooks(provider?: WebhookProvider, status?: 'pending' | 'processed' | 'failed'): WebhookStorageRecord[] {
    let result = [...this.webhooks];
    
    if (provider) {
      result = result.filter(w => w.provider === provider);
    }
    
    if (status) {
      result = result.filter(w => w.status === status);
    }
    
    return result;
  }

  /**
   * Get pending webhooks that need processing
   * @param maxAttempts Maximum number of processing attempts
   * @returns Array of pending webhook records
   */
  public getPendingWebhooks(maxAttempts: number = 3): WebhookStorageRecord[] {
    return this.webhooks.filter(w => 
      w.status === 'pending' && 
      w.processingAttempts < maxAttempts
    );
  }

  /**
   * Clear all webhooks (for testing purposes)
   */
  public clearWebhooks(): void {
    this.webhooks = [];
  }
} 