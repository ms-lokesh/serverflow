import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastToRestaurant } from '../websocket';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/menu
 * List dishes
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const result = await query(
      `SELECT id, name, category, price, gst_percentage, is_available, is_veg, description, popular
       FROM dishes
       WHERE restaurant_id = $1
       ORDER BY category, name ASC`,
      [restaurantId]
    );

    const dishes = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      price: parseFloat(r.price),
      gstPercentage: parseFloat(r.gst_percentage || '5'),
      isAvailable: r.is_available,
      isVeg: r.is_veg,
      description: r.description,
      popular: r.popular,
    }));

    res.json({ success: true, data: dishes });
  } catch (err) {
    console.error('[Get Menu Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_MENU' });
  }
});

/**
 * POST /api/menu
 * Add dish (Admin only)
 */
router.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { name, category, price, isVeg, description, popular } = req.body;

    if (!name || !category || price === undefined) {
      res.status(400).json({ success: false, error: 'MISSING_FIELDS' });
      return;
    }

    const id = `dish_${Date.now()}`;
    await query(
      `INSERT INTO dishes (id, restaurant_id, name, category, price, is_veg, description, popular)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, restaurantId, name, category, price, isVeg ?? true, description || null, popular ?? false]
    );

    res.status(201).json({ success: true, data: { id, name, category, price, isVeg, description, popular } });
  } catch (err) {
    console.error('[Add Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_ADD_DISH' });
  }
});

/**
 * PUT /api/menu/:id
 * Update price or dish info (Admin only)
 */
router.put('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { name, price, category, isAvailable, isVeg } = req.body;

    await query(
      `UPDATE dishes
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           category = COALESCE($3, category),
           is_available = COALESCE($4, is_available),
           is_veg = COALESCE($5, is_veg),
           updated_at = NOW()
       WHERE id = $6 AND restaurant_id = $7`,
      [name, price, category, isAvailable, isVeg, id, restaurantId]
    );

    res.json({ success: true, message: 'Dish updated successfully' });
  } catch (err) {
    console.error('[Update Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_UPDATE_DISH' });
  }
});

/**
 * PATCH /api/menu/:id/toggle
 * Toggle dish availability (Admin or Kitchen) with real-time broadcast
 */
router.patch('/:id/toggle', requireRole('ADMIN', 'KITCHEN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    const result = await query(
      `UPDATE dishes
       SET is_available = NOT is_available, updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING id, name, is_available`,
      [id, restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND' });
      return;
    }

    const dish = result.rows[0];

    // Broadcast instantaneously to all clients (waiters, cashier, kitchen, admin)
    broadcastToRestaurant(restaurantId, 'DISH_AVAILABILITY_CHANGED', {
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });

    res.json({ success: true, dishId: dish.id, dishName: dish.name, isAvailable: dish.is_available });
  } catch (err) {
    console.error('[Toggle Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_TOGGLE_DISH' });
  }
});

/**
 * POST /api/menu/:id/stock-out
 * Explicitly set dish availability (Stock Out 86 or Restock)
 */
router.post('/:id/stock-out', requireRole('ADMIN', 'KITCHEN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const { isAvailable } = req.body;

    const targetAvail = isAvailable === undefined ? false : Boolean(isAvailable);

    const result = await query(
      `UPDATE dishes
       SET is_available = $1, updated_at = NOW()
       WHERE id = $2 AND restaurant_id = $3
       RETURNING id, name, is_available`,
      [targetAvail, id, restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND' });
      return;
    }

    const dish = result.rows[0];

    broadcastToRestaurant(restaurantId, 'DISH_AVAILABILITY_CHANGED', {
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });

    res.json({ success: true, dishId: dish.id, dishName: dish.name, isAvailable: dish.is_available });
  } catch (err) {
    console.error('[Stock Out Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_SET_STOCK_OUT' });
  }
});

export default router;
