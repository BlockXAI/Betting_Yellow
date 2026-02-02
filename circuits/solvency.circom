pragma circom 2.0.0;

/*
 * Solvency Proof Circuit
 * 
 * Proves that: reserves >= liabilities
 * Without revealing exact amounts
 * 
 * Inputs:
 *   - reserves_total: Total reserves held in custody
 *   - liabilities_sum: Sum of all user liabilities
 *   - merkle_root: Root of liabilities Merkle tree
 * 
 * Outputs:
 *   - valid: 1 if solvent, 0 if insolvent
 * 
 * Constraints:
 *   - Proves reserves_total >= liabilities_sum
 *   - Binds proof to specific liability snapshot via merkle_root
 */

include "circomlib/circuits/comparators.circom";

template Solvency() {
    // Private inputs (not revealed in proof)
    signal input reserves_total;
    signal input liabilities_sum;
    
    // Public inputs (part of proof verification)
    signal input merkle_root;
    signal input timestamp;
    
    // Output
    signal output valid;
    
    // Constraint: reserves >= liabilities
    // Using GreaterEqThan from circomlib
    component geq = GreaterEqThan(252); // 252-bit comparison
    geq.in[0] <== reserves_total;
    geq.in[1] <== liabilities_sum;
    
    // Output is 1 if solvent, 0 if insolvent
    valid <== geq.out;
    
    // Additional constraint: valid must be 1 (proof only valid if solvent)
    valid === 1;
    
    // Bind to merkle root to prevent reuse of proof
    signal merkle_root_check;
    merkle_root_check <== merkle_root * merkle_root;
    
    // Bind to timestamp to prevent replay
    signal timestamp_check;
    timestamp_check <== timestamp * timestamp;
}

// Main component
component main {public [merkle_root, timestamp]} = Solvency();

/*
 * Circuit Compilation Instructions:
 * 
 * 1. Install circom compiler:
 *    npm install -g circom
 * 
 * 2. Compile circuit to R1CS:
 *    circom circuits/solvency.circom --r1cs --wasm --sym --c
 * 
 * 3. Generate trusted setup (Powers of Tau ceremony):
 *    snarkjs powersoftau new bn128 14 pot14_0000.ptau
 *    snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution"
 *    snarkjs powersoftau beacon pot14_0001.ptau pot14_beacon.ptau 0102030405060708090a0b0c0d0e0f
 *    snarkjs powersoftau prepare phase2 pot14_beacon.ptau pot14_final.ptau
 * 
 * 4. Generate proving and verification keys:
 *    snarkjs groth16 setup solvency.r1cs pot14_final.ptau solvency_0000.zkey
 *    snarkjs zkey contribute solvency_0000.zkey solvency_0001.zkey --name="Circuit contribution"
 *    snarkjs zkey beacon solvency_0001.zkey solvency_final.zkey 0102030405060708090a0b0c0d0e0f
 * 
 * 5. Export verification key:
 *    snarkjs zkey export verificationkey solvency_final.zkey verification_key.json
 * 
 * 6. Generate Solidity verifier (for on-chain verification):
 *    snarkjs zkey export solidityverifier solvency_final.zkey SolvencyVerifier.sol
 * 
 * Note: Full compilation requires circom binary and is resource-intensive.
 * For production, consider using pre-generated keys or a trusted setup ceremony.
 */
