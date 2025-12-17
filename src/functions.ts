import express from 'express';
import cors from 'cors'
import { accessAsset } from './access-asset';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../.env') }); // src より一つ上の階層

//import { publishAsset } from './publish-asset';
const app = express();
app.use(express.json());

// Allow browser requests from any origin 
app.use(cors())

app.post('/access', async (req, res) => {
  const data = await accessAsset(req.body.assetDid);
  res.json({ data });
});

/*
app.post('/publish', async (req, res) => {
  const result = await publishAsset(req.body);
  res.json({ result });
});
*/
app.listen(3000, () => console.log('API running on http://localhost:3000'));


//npx ts-node functions.ts 