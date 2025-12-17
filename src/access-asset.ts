import { Wallet, providers } from 'ethers'
import { Nautilus } from '@deltadao/nautilus'
import 'dotenv/config'

export async function accessAsset(assetDid: string) {
  // Create RPC provider
  const provider = new providers.JsonRpcProvider(
    'https://eth-sepolia.g.alchemy.com/v2/LXk98TiUklG4fikBjnfyc'
  )

  // Create wallet (private key is retrieved from environment variables)
  const signer = new Wallet(process.env.PRIVATE_KEY!, provider)

  // Create Nautilus instance
  const nautilus = await Nautilus.create(signer)

  // Access the data
  const accessUrl = await nautilus.access({ assetDid })
  const data = await fetch(accessUrl)
  const text = await data.text()

  return text
}

// If this file is executed directly
if (require.main === module) {
  (async () => {
    const result = await accessAsset('did:op:12345')
    console.log(result)
  })()
}
