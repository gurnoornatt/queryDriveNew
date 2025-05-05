import { Express, Request, Response, NextFunction } from 'express';
import * as doordashRestaurant from '../clients/doordashRestaurant';

/**
 * Setup routes for restaurant operations with DoorDash
 */
export const setupRestaurantRoutes = (app: Express) => {
  /**
   * @route POST /api/restaurants/doordash/businesses
   * @description Create a new restaurant business in DoorDash
   */
  app.post('/api/restaurants/doordash/businesses', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const businessData = req.body;
      const result = await doordashRestaurant.createBusiness(businessData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /api/restaurants/doordash/businesses/:externalBusinessId
   * @description Get a restaurant business by ID from DoorDash
   */
  app.get('/api/restaurants/doordash/businesses/:externalBusinessId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalBusinessId } = req.params;
      const result = await doordashRestaurant.getBusiness(externalBusinessId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /api/restaurants/doordash/businesses
   * @description List all restaurant businesses from DoorDash
   */
  app.get('/api/restaurants/doordash/businesses', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const result = await doordashRestaurant.listBusinesses(limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PATCH /api/restaurants/doordash/businesses/:externalBusinessId
   * @description Update a restaurant business in DoorDash
   */
  app.patch('/api/restaurants/doordash/businesses/:externalBusinessId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalBusinessId } = req.params;
      const businessData = {
        ...req.body,
        external_business_id: externalBusinessId,
      };
      const result = await doordashRestaurant.updateBusiness(businessData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /api/restaurants/doordash/stores
   * @description Create a new restaurant store in DoorDash
   */
  app.post('/api/restaurants/doordash/stores', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeData = req.body;
      const result = await doordashRestaurant.createStore(storeData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId
   * @description Get a restaurant store by ID from DoorDash
   */
  app.get('/api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalBusinessId, externalStoreId } = req.params;
      const result = await doordashRestaurant.getStore(externalBusinessId, externalStoreId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route GET /api/restaurants/doordash/businesses/:externalBusinessId/stores
   * @description List all stores for a restaurant business from DoorDash
   */
  app.get('/api/restaurants/doordash/businesses/:externalBusinessId/stores', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalBusinessId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const result = await doordashRestaurant.listStores(externalBusinessId, limit, offset);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route PATCH /api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId
   * @description Update a restaurant store in DoorDash
   */
  app.patch('/api/restaurants/doordash/businesses/:externalBusinessId/stores/:externalStoreId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { externalBusinessId, externalStoreId } = req.params;
      const storeData = {
        ...req.body,
        external_business_id: externalBusinessId,
        external_store_id: externalStoreId,
      };
      const result = await doordashRestaurant.updateStore(storeData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * @route POST /api/restaurants/doordash/deliveries
   * @description Create a delivery from a restaurant store
   */
  app.post('/api/restaurants/doordash/deliveries', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deliveryData = req.body;
      const result = await doordashRestaurant.createDeliveryFromStore(deliveryData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
}; 