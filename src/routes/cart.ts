import { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { prisma } from '../libs/prisma/index.js';

const router = Router();

const verifySignature = (query: any, secret: string): boolean => {
  const { signature, ...rest } = query;
  const sortedParams = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('');
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
  return calculatedSignature === signature;
}

const saveCart = async (customerId: string, items: string[]): Promise<void> => {
  await prisma.savedCart.create({
    data: {
      customerId,
      products: items.join(',')
    }
  });
}

export const handleSaveCart = async (req: Request, res: Response): Promise<void> => {
  const { shop, logged_in_customer_id, signature } = req.query;
  const { items } = req.body;

  if (!verifySignature(req.query, process.env.SHOPIFY_API_SECRET as string)) {
    res.status(401).send('Unauthorized');
    return;
  }

  try {
    await saveCart(logged_in_customer_id as string, items);
    res.status(200).json({ message: 'Cart saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save cart' });
  }
}


router.post('/save-cart', handleSaveCart);

export default router;