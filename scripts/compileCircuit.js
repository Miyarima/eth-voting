const { wasm: wasm_tester } = require("circom_tester");
const path = require("path");
const fs = require("fs");
const snarkjs = require("snarkjs");

async function compile() {
  try {
    console.log("Starting circuit compilation...");
    
    // 1. Compile the circuit
    const circuitPath = path.join(__dirname, "../circuits/vote.circom");
    const circuit = await wasm_tester(circuitPath);
    
    console.log("Circuit compiled successfully");
    
    // 2. Generate the proving/verification keys
    console.log("Generating zkey...");
    const { zkey } = await snarkjs.zKey.newZKey(
      await circuit.r1cs(),
      path.join(__dirname, "../circuits/powersOfTau28_hez_final_10.ptau"),
      path.join(__dirname, "../circuits/vote.zkey")
    );
    
    console.log("zkey generated");
    
    // 3. Export verifier contract
    console.log("Exporting verifier...");
    const verifier = await snarkjs.zKey.exportSolidityVerifier(zkey);
    fs.writeFileSync(path.join(__dirname, "../contracts/Verifier.sol"), verifier);
    
    console.log("✅ Verifier contract generated at contracts/Verifier.sol");
  } catch (err) {
    console.error("❌ Compilation failed:", err);
    process.exit(1);
  }
}

compile();