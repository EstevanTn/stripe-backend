// @ts-nocheck
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const port = 8000;

// Configuración de CORS para permitir solo orígenes específicos
app.use(
  cors({
    origin: whitelist,
  })
);

// Middleware para parsear el cuerpo de las solicitudes en formato JSON
app.use(bodyParser.json());

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { amount, token, name } = req.body;

    // Creación del método de pago utilizando el token proporcionado
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: token.id,
      },
      billing_details: {
        name,
      },
    });

    // Creación del intent de pago con los detalles necesarios
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    // Envío de la clave secreta del intent de pago al cliente
    res.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Inicio del servidor en el puerto especificado
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
