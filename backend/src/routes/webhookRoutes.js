const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const wh = new Webhook(webhookSecret);
    const payload = req.body;
    const headerPayload = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const evt = wh.verify(JSON.stringify(payload), headerPayload);

    // Handle the webhook
    const eventType = evt.type;
    const { id, email_addresses, ...attributes } = evt.data;

    console.log(`Webhook recebido: ${eventType}`);

    if (eventType === 'user.created') {
      const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id);
      
      if (!primaryEmail) {
        console.error('Usuário sem email primário');
        return res.status(400).json({ error: 'Usuário sem email primário' });
      }

      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: primaryEmail.email_address,
          name: `${attributes.first_name || ''} ${attributes.last_name || ''}`.trim() || 'Usuário',
        }
      });

      console.log('Usuário criado:', user);
    }

    res.status(200).json({ message: 'Webhook processado com sucesso' });
  } catch (err) {
    console.error('Erro ao processar webhook:', err);
    res.status(400).json({ error: 'Erro ao processar webhook' });
  }
});

module.exports = router; 