const {
  AccesslistFactory,
  ZERO_ADDRESS,
  createAsset
} = require("@oceanprotocol/lib");

function getEventFromTx(
  txReceipt,
  eventName
) {
  if (!txReceipt || !txReceipt.logs) {
    return undefined
  }
  const foundLog = txReceipt.events.filter((log) => {
    return log && log.event === eventName
  })[0]

  return foundLog
}

function getSignerAccordingSdk(signer, config) {
  return config && 'sdk' in config && config.sdk === 'oasis'
    ? sapphire.wrap(signer)
    : signer
}

async function createAssetUtil(
  name,
  symbol,
  owner,
  assetUrl,
  ddo,
  oceanNodeUrl,
  config,
  aquariusInstance,
  encryptDDO = true,
  templateIDorAddress = 1,
  providerFeeToken = ZERO_ADDRESS,
  accessListFactory,
  allowAccessList,
  denyAccessList,
) {
  const isAddress = typeof templateIDorAddress === 'string'
  const isTemplateIndex = typeof templateIDorAddress === 'number'
  if (!isAddress && !isTemplateIndex) {
    throw new Error('Invalid template! Must be a "number" or a "string"')
  }
  const { chainId } = await owner.provider.getNetwork();
  const signer = getSignerAccordingSdk(owner, config);

  if (config.sdk === 'oasis') {
    // Create Access List Factory
    const accessListFactoryObj = new AccesslistFactory(config.accessListFactory, signer, Number(chainId));

    // Create Allow List
    await accessListFactoryObj.deployAccessListContract(
      'AllowList',
      'ALLOW',
      ['https://oceanprotocol.com/nft/'],
      false,
      await owner.getAddress(),
      [await owner.getAddress(), ZERO_ADDRESS]
    )
    return await createAsset(name, symbol, signer, assetUrl, templateIDorAddress, ddo, encryptDDO, oceanNodeUrl, providerFeeToken, aquariusInstance, accessListFactory, allowAccessList, denyAccessList);
  }
  return await createAsset(name, symbol, signer, assetUrl, templateIDorAddress, ddo, encryptDDO, oceanNodeUrl, providerFeeToken, aquariusInstance);
}



module.exports = {
  getEventFromTx,
  createAssetUtil,
};