import { Router, Response } from 'express';
import { query } from '../db/pool';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { broadcastToRestaurant } from '../websocket';

const router = Router();
router.use(authenticateToken);

/**
 * Format a DB dish row to frontend Dish model
 */
function formatDishRow(r: any) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: parseFloat(r.price),
    gstPercentage: parseFloat(r.gst_percentage || '5'),
    isAvailable: Boolean(r.is_available),
    isVeg: Boolean(r.is_veg),
    description: r.description || '',
    popular: Boolean(r.popular),
  };
}

/**
 * GET /api/menu
 * List all dishes for the authenticated restaurant
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

    const dishes = result.rows.map(formatDishRow);
    res.json({ success: true, data: dishes });
  } catch (err) {
    console.error('[Get Menu Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_FETCH_MENU' });
  }
});

/**
 * POST /api/menu
 * Add new dish (Admin only)
 */
router.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const {
      name,
      category,
      price,
      isVeg,
      isAvailable,
      description,
      popular,
      gstPercentage,
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ success: false, error: 'MISSING_NAME', message: 'Dish name is required.' });
      return;
    }

    if (!category || !category.trim()) {
      res.status(400).json({ success: false, error: 'MISSING_CATEGORY', message: 'Category is required.' });
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({ success: false, error: 'INVALID_PRICE', message: 'Valid price greater than 0 is required.' });
      return;
    }

    const id = `dish_${Date.now()}`;
    const gst = gstPercentage !== undefined ? parseFloat(gstPercentage) : 5.0;
    const veg = isVeg !== undefined ? Boolean(isVeg) : true;
    const avail = isAvailable !== undefined ? Boolean(isAvailable) : true;
    const pop = popular !== undefined ? Boolean(popular) : false;
    const desc = description ? description.trim() : null;

    const result = await query(
      `INSERT INTO dishes (id, restaurant_id, name, category, price, gst_percentage, is_available, is_veg, description, popular)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, category, price, gst_percentage, is_available, is_veg, description, popular`,
      [id, restaurantId, name.trim(), category.trim(), numPrice, gst, avail, veg, desc, pop]
    );

    const newDish = formatDishRow(result.rows[0]);

    // Broadcast real-time addition to all connected terminals
    broadcastToRestaurant(restaurantId, 'DISH_ADDED', { dish: newDish });

    res.status(201).json({
      success: true,
      message: `Dish "${newDish.name}" added successfully.`,
      data: newDish,
    });
  } catch (err: any) {
    console.error('[Add Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_ADD_DISH', message: err.message });
  }
});

/**
 * PUT /api/menu/:id
 * Update dish details or price (Admin only)
 */
router.put('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;
    const {
      name,
      price,
      category,
      isAvailable,
      isVeg,
      description,
      popular,
      gstPercentage,
    } = req.body;

    const numPrice = price !== undefined ? parseFloat(price) : null;
    const gst = gstPercentage !== undefined ? parseFloat(gstPercentage) : null;

    const result = await query(
      `UPDATE dishes
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           category = COALESCE($3, category),
           is_available = COALESCE($4, is_available),
           is_veg = COALESCE($5, is_veg),
           description = COALESCE($6, description),
           popular = COALESCE($7, popular),
           gst_percentage = COALESCE($8, gst_percentage),
           updated_at = NOW()
       WHERE id = $9 AND restaurant_id = $10
       RETURNING id, name, category, price, gst_percentage, is_available, is_veg, description, popular`,
      [
        name ? name.trim() : null,
        numPrice,
        category ? category.trim() : null,
        isAvailable !== undefined ? Boolean(isAvailable) : null,
        isVeg !== undefined ? Boolean(isVeg) : null,
        description !== undefined ? description : null,
        popular !== undefined ? Boolean(popular) : null,
        gst,
        id,
        restaurantId,
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND', message: 'Dish not found.' });
      return;
    }

    const updatedDish = formatDishRow(result.rows[0]);

    // Broadcast real-time update
    broadcastToRestaurant(restaurantId, 'DISH_UPDATED', { dish: updatedDish });

    res.json({
      success: true,
      message: 'Dish updated successfully',
      data: updatedDish,
    });
  } catch (err: any) {
    console.error('[Update Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_UPDATE_DISH', message: err.message });
  }
});

/**
 * DELETE /api/menu/:id
 * Remove dish from menu (Admin only)
 */
router.delete('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const restaurantId = req.user!.restaurantId;
    const { id } = req.params;

    // Check if dish exists
    const checkRes = await query(
      `SELECT id, name FROM dishes WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    if (checkRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND', message: 'Dish not found.' });
      return;
    }

    const dishName = checkRes.rows[0].name;

    // Delete dish
    await query(
      `DELETE FROM dishes WHERE id = $1 AND restaurant_id = $2`,
      [id, restaurantId]
    );

    // Broadcast deletion to all screens
    broadcastToRestaurant(restaurantId, 'DISH_DELETED', {
      dishId: id,
      dishName,
    });

    res.json({
      success: true,
      message: `Dish "${dishName}" removed successfully.`,
      dishId: id,
    });
  } catch (err: any) {
    console.error('[Delete Dish Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_DELETE_DISH', message: err.message });
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
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND', message: 'Dish not found.' });
      return;
    }

    const dish = result.rows[0];

    // Broadcast instantaneously to all clients (waiters, cashier, kitchen, admin)
    broadcastToRestaurant(restaurantId, 'DISH_AVAILABILITY_CHANGED', {
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });

    res.json({
      success: true,
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });
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
      res.status(404).json({ success: false, error: 'DISH_NOT_FOUND', message: 'Dish not found.' });
      return;
    }

    const dish = result.rows[0];

    broadcastToRestaurant(restaurantId, 'DISH_AVAILABILITY_CHANGED', {
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });

    res.json({
      success: true,
      dishId: dish.id,
      dishName: dish.name,
      isAvailable: dish.is_available,
    });
  } catch (err) {
    console.error('[Stock Out Error]:', err);
    res.status(500).json({ success: false, error: 'FAILED_TO_SET_STOCK_OUT' });
  }
});

export default router;
