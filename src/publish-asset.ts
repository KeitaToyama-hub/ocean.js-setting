import { Wallet, providers } from 'ethers'
import { Nautilus, AssetBuilder, ServiceBuilder, ServiceTypes, FileTypes, UrlFile } from '@deltadao/nautilus'
import 'dotenv/config'

export async function publishAsset() {
  // 1. Create RPC provider (example: Sepolia testnet)
  const provider = new providers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/LXk98TiUklG4fikBjnfyc')

  // 2. Create wallet (private key from .env)
  const signer = new Wallet(process.env.PRIVATE_KEY!, provider)

  // 3. Create Nautilus instance
  const nautilus = await Nautilus.create(signer)

  // 4. Create asset metadata using AssetBuilder
  const assetBuilder = new AssetBuilder()
  assetBuilder
    .setType('dataset') // dataset / algorithm / service, etc.
    .setName('My New Dataset')
    .setDescription('This is a test asset published via Nautilus')
    .setAuthor('Your Company Ltd.')

  // 5. Create access service using ServiceBuilder
  const serviceBuilder = new ServiceBuilder({
    serviceType: ServiceTypes.ACCESS,
    fileType: FileTypes.URL
  })

  // Define file to be accessed
  const urlFile: UrlFile = {
    type: 'url',
    url: 'https://example.com/my-dataset.csv', // Replace with your publicly accessible URL
    method: 'GET'
  }

  const service = serviceBuilder
    .setServiceEndpoint('https://ocean-node-vm3.oceanenterprise.io') // Provider URL
    .setTimeout(0)
    .addFile(urlFile)
    .setPricing({ type: 'free' }) // For paid assets, use type: 'fixed', etc.
    .build()

  // 6. Add service to asset and build
  const asset = assetBuilder.addService(service).build()

  // 7. Publish asset on the network
  const result = await nautilus.publish(asset)
  console.log('Publish result:', result)

  return result
}

// If this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      const result = await publishAsset()
      console.log('Published Asset details:', result)
    } catch (err) {
      console.error(err)
    }
  })()
}
