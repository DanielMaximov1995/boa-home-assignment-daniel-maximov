import { join } from "path";
import express from "express";
import { readFileSync } from "fs";
import serveStatic from "serve-static";
import dotenv from "dotenv";
import cors from 'cors'

import shopify from "./shopify.js";
import cartRouter from './routes/cart.js';

dotenv.config();

const backendPort = process.env.BACKEND_PORT as string;
const envPort = process.env.PORT as string;
const PORT = parseInt(backendPort || envPort, 10);

const app = express();

app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

app.post(shopify.config.webhooks.path, shopify.processWebhooks({ webhookHandlers: {} }));

app.use(cors({
  origin : "*"
}));

app.use(express.json());

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(serveStatic(`${process.cwd()}/frontend/`, { index: false }));

app.use('/proxy', cartRouter);

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {

  const htmlContent = readFileSync(
    join(`${process.cwd()}/frontend/`, "index.html"),
    "utf-8"
  );
  const transformedHtml = htmlContent.replace(
    /%SHOPIFY_API_KEY%/g,
    process.env.SHOPIFY_API_KEY || ""
  );


  res.status(200).set("Content-Type", "text/html").send(transformedHtml);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
