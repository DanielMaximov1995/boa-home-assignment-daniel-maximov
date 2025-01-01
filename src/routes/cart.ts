import { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../libs/prisma/index.js';

const router = Router();


export const handleSaveCart = async (req: Request, res: Response): Promise<void> => {
  const { items , customerId } = req.body;
  
  try {
    await prisma.savedCart.create({
      data: {
        customerId,
        products: items.join(',')
      }
    });
    res.status(200).json({ message: 'Cart saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save cart' });
  }
}


router.post('/save-cart', handleSaveCart);

export default router;