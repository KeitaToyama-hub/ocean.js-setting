const { oceanConfig } = require('./config.js');

async function runTest() {
  try {
    console.log("--- Starting Ocean Config Test ---");

    // Execute the function
    const config = await oceanConfig();

    // Log the result to verify it worked
    console.log("Config successfully generated:");
    console.log(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTest();