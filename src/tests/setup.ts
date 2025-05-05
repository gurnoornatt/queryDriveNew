import { beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Define handlers for your mock API
export const handlers = [
  // DoorDash mock handlers
  http.post('https://openapi.doordash.com/drive/v2/quotes', () => {
    return HttpResponse.json({
      external_delivery_id: 'test-delivery-id',
      quote_id: 'test-quote-id',
      currency: 'USD',
      fee: 10.5,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }),

  // Uber mock handlers
  http.post('https://api.uber.com/v1/deliveries/quote', () => {
    return HttpResponse.json({
      id: 'test-uber-quote-id',
      fee: {
        amount: 9.75,
        currency: 'USD',
      },
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }),
];

// Set up the server
const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close server after all tests
afterAll(() => server.close());

export { server };
