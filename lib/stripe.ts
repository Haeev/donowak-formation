import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Donowak Formation',
    version: '0.1.0',
  },
}); 