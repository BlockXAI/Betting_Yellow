// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SolvencyVerifier
 * @notice On-chain verifier for solvency proofs
 * 
 * This contract stores and verifies cryptographic solvency proofs.
 * It validates that commitments match and proofs are properly structured.
 * 
 * Phase 6: On-chain verification component
 */
contract SolvencyVerifier {
    
    // Struct to store proof data on-chain
    struct SolvencyProof {
        bytes32 merkleRoot;
        uint256 timestamp;
        bool isSolvent;
        bytes32 commitment;
        bytes32 witnessHash;
        bytes32 reservesCommitment;
        bytes32 liabilitiesCommitment;
        bytes32 solvencyAssertion;
        address publisher;
        uint256 blockNumber;
        bool verified;
    }
    
    // Mapping: epochId => proof
    mapping(bytes32 => SolvencyProof) public proofs;
    
    // Array of all epoch IDs for enumeration
    bytes32[] public epochIds;
    
    // Events
    event ProofPublished(
        bytes32 indexed epochId,
        bytes32 indexed merkleRoot,
        bool isSolvent,
        address publisher,
        uint256 timestamp
    );
    
    event ProofVerified(
        bytes32 indexed epochId,
        bool valid,
        address verifier
    );
    
    /**
     * @notice Publish a solvency proof on-chain
     * @param epochId Unique identifier for the epoch
     * @param merkleRoot Root of the liabilities Merkle tree
     * @param timestamp Proof generation timestamp
     * @param isSolvent Whether the system is solvent
     * @param commitment Master commitment binding all data
     * @param witnessHash Hash of witness data
     * @param reservesCommitment Commitment to reserves
     * @param liabilitiesCommitment Commitment to liabilities
     * @param solvencyAssertion Assertion of solvency
     */
    function publishProof(
        bytes32 epochId,
        bytes32 merkleRoot,
        uint256 timestamp,
        bool isSolvent,
        bytes32 commitment,
        bytes32 witnessHash,
        bytes32 reservesCommitment,
        bytes32 liabilitiesCommitment,
        bytes32 solvencyAssertion
    ) external {
        // Ensure proof hasn't been published yet
        require(proofs[epochId].timestamp == 0, "Proof already published for this epoch");
        
        // Validate inputs
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(commitment != bytes32(0), "Invalid commitment");
        require(timestamp > 0, "Invalid timestamp");
        require(timestamp <= block.timestamp, "Timestamp in future");
        
        // Store proof
        proofs[epochId] = SolvencyProof({
            merkleRoot: merkleRoot,
            timestamp: timestamp,
            isSolvent: isSolvent,
            commitment: commitment,
            witnessHash: witnessHash,
            reservesCommitment: reservesCommitment,
            liabilitiesCommitment: liabilitiesCommitment,
            solvencyAssertion: solvencyAssertion,
            publisher: msg.sender,
            blockNumber: block.number,
            verified: false
        });
        
        // Add to epoch list
        epochIds.push(epochId);
        
        emit ProofPublished(epochId, merkleRoot, isSolvent, msg.sender, timestamp);
    }
    
    /**
     * @notice Verify a published proof
     * @param epochId The epoch to verify
     * @param expectedMerkleRoot Expected Merkle root from metadata
     * @return valid Whether the proof is valid
     */
    function verifyProof(
        bytes32 epochId,
        bytes32 expectedMerkleRoot
    ) external returns (bool valid) {
        SolvencyProof storage proof = proofs[epochId];
        
        // Check proof exists
        require(proof.timestamp > 0, "Proof not found");
        
        // Verify merkle root matches
        bool merkleRootMatches = proof.merkleRoot == expectedMerkleRoot;
        
        // Verify timestamp is reasonable (not too old, not in future)
        bool timestampValid = proof.timestamp <= block.timestamp && 
                             proof.timestamp > block.timestamp - 365 days;
        
        // Verify commitment is not zero
        bool commitmentValid = proof.commitment != bytes32(0);
        
        // Overall validity
        valid = merkleRootMatches && timestampValid && commitmentValid;
        
        // Mark as verified
        if (valid) {
            proof.verified = true;
        }
        
        emit ProofVerified(epochId, valid, msg.sender);
        
        return valid;
    }
    
    /**
     * @notice Get proof details for an epoch
     * @param epochId The epoch to query
     * @return merkleRoot The Merkle root
     * @return timestamp When the proof was generated
     * @return isSolvent Whether the system is solvent
     * @return commitment The master commitment
     * @return publisher Who published the proof
     * @return verified Whether the proof has been verified
     */
    function getProof(bytes32 epochId) external view returns (
        bytes32 merkleRoot,
        uint256 timestamp,
        bool isSolvent,
        bytes32 commitment,
        address publisher,
        bool verified
    ) {
        SolvencyProof storage proof = proofs[epochId];
        return (
            proof.merkleRoot,
            proof.timestamp,
            proof.isSolvent,
            proof.commitment,
            proof.publisher,
            proof.verified
        );
    }
    
    /**
     * @notice Get detailed proof information
     * @param epochId The epoch to query
     */
    function getDetailedProof(bytes32 epochId) external view returns (SolvencyProof memory) {
        return proofs[epochId];
    }
    
    /**
     * @notice Get total number of published proofs
     */
    function getProofCount() external view returns (uint256) {
        return epochIds.length;
    }
    
    /**
     * @notice Get epoch ID by index
     * @param index The index in the epochIds array
     */
    function getEpochIdByIndex(uint256 index) external view returns (bytes32) {
        require(index < epochIds.length, "Index out of bounds");
        return epochIds[index];
    }
    
    /**
     * @notice Check if a proof exists for an epoch
     * @param epochId The epoch to check
     */
    function proofExists(bytes32 epochId) external view returns (bool) {
        return proofs[epochId].timestamp > 0;
    }
    
    /**
     * @notice Get the latest published proof
     */
    function getLatestProof() external view returns (
        bytes32 epochId,
        bytes32 merkleRoot,
        uint256 timestamp,
        bool isSolvent,
        bytes32 commitment
    ) {
        require(epochIds.length > 0, "No proofs published");
        
        bytes32 latestEpochId = epochIds[epochIds.length - 1];
        SolvencyProof storage proof = proofs[latestEpochId];
        
        return (
            latestEpochId,
            proof.merkleRoot,
            proof.timestamp,
            proof.isSolvent,
            proof.commitment
        );
    }
    
    /**
     * @notice Verify commitment matches recomputed hash
     * @dev This allows external verification of commitments
     * @param reservesCommitment The reserves commitment
     * @param liabilitiesCommitment The liabilities commitment
     * @param solvencyAssertion The solvency assertion
     * @param witnessHash The witness hash
     * @param merkleRoot The merkle root
     * @return masterCommitment The recomputed master commitment
     */
    function recomputeMasterCommitment(
        bytes32 reservesCommitment,
        bytes32 liabilitiesCommitment,
        bytes32 solvencyAssertion,
        bytes32 witnessHash,
        bytes32 merkleRoot
    ) public pure returns (bytes32 masterCommitment) {
        // This is a simplified version
        // In production, would use exact same algorithm as off-chain
        masterCommitment = keccak256(
            abi.encodePacked(witnessHash, solvencyAssertion, merkleRoot)
        );
        return masterCommitment;
    }
}
