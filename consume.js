// Note: Make sure .env file and config.js are created and setup correctly
const { oceanConfig } = require("./config.js");
const { fetch } = require("cross-fetch");
const path = require("path"); // Added path module
const fs = require("fs").promises; // Added fs module with promises support


const {
    Datatoken,
    ProviderInstance,
    orderAsset,
    Aquarius
} = require("@oceanprotocol/lib");

// replace the did here
const did = "did:ope:1fd532ab6c3b4190390407ea5178de39d7a6a2c643451263c30d6f723313e231";

async function downloadFile(
    url,
    downloadPath
) {
    const response = await fetch(url);
    console.log('response', response?.status);
    if (!response.ok) {
        throw new Error("Response error.");
    }

    const defaultName = 'file.out'
    let filename

    try {
        // try to get it from headers
        filename = response.headers
            .get("content-disposition")
            .match(/attachment;filename=(.+)/)[1];
    } catch {
        filename = defaultName;
    }

    const filePath = path.join(downloadPath, filename);
    const data = await response.arrayBuffer();

    try {
        await fs.writeFile(filePath, Buffer.from(data));
    } catch (err) {
        throw new Error("Error while saving the file:", err.message);
    }

    return { data, filename };
}

// This function takes did as a parameter and updates the data NFT information
const consumeAsset = async (did) => {
    const config = await oceanConfig();
    const consumer = config.consumerAccount;

    // Fetch ddo from Aquarius
    const aquarius = new Aquarius('https://ocean-node-vm3.oceanenterprise.io');
    console.log('aquarius', aquarius);
    console.log("Consuming asset with DID:", did);
    const asset = await aquarius.waitForIndexer(did, null, null, 4000, 100);
    console.log("Asset to consume:", asset);
    const serviceId = asset.credentialSubject.services[0].id;
    const datatoken = new Datatoken(
        consumer,
        11155111,
        config
    );
    const tx = await orderAsset(
        asset,
        consumer,
        config,
        datatoken,
        asset.credentialSubject.services[0].serviceEndpoint
    );
    if (!tx) {
        console.error(
            "Error ordering access for " + did + ".  Do you have enough tokens?"
        );
        return;
    }

    const orderTx = await tx.wait();

    console.log('orderTx', orderTx);
    const policyServer = {
        sessionId: '',
        successRedirectUri: ``,
        errorRedirectUri: ``,
        responseRedirectUri: ``,
        presentationDefinitionUri: ``
    }
    const downloadURL = await ProviderInstance.getDownloadUrl(
        asset.id,
        serviceId,
        0,
        orderTx.transactionHash,
        asset.credentialSubject.services[0].serviceEndpoint,
        consumer,
        policyServer
    );

    try {
        const path = ".";
        const { filename } = await downloadFile(downloadURL, path);
        console.log("File downloaded successfully:", path + "/" + filename);
    } catch (e) {
        console.log(`Download url dataset failed: ${e}`);
    }
};

consumeAsset(did).then(() => {
    process.exit();
}).catch((err) => {
    console.error(err);
    process.exit(1);
});