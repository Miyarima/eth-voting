// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract Voting_program {
    struct Candidate {
        string name;
        uint256 voteCount;
    }

    Candidate[] public candidates;
    address owner;
    Verifier public verifier;
    mapping(address => bool) public voters;

    constructor(string[] memory _candidateNames, address _verifier) {
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(Candidate({
                name: _candidateNames[i],
                voteCount: 0
            }));
        }
        owner = msg.sender;
        verifier = Verifier(_verifier);
    }

    // function vote(uint256 _candidateIndex) public {
    //     require(!voters[msg.sender], "You have already voted.");
    //     require(_candidateIndex < candidates.length, "Invalid candidate index.");

    //     candidates[_candidateIndex].voteCount++;
    //     voters[msg.sender] = true;
    // }

    function vote(uint256 _candidateIndex, uint256[] calldata _proof, uint256 _nullifier) public {
        require(!nullifiers[_nullifier], "Proof already used");
        require(_candidateIndex < candidates.length, "Invalid candidate");
        
        // Verify proof
        uint256[] memory inputs = new uint256[](1);
        inputs[0] = _nullifier; // voterId
        require(
            verifier.verifyProof(_proof, inputs),
            "Invalid proof"
        );
        
        candidates[_candidateIndex].voteCount++;
        nullifiers[_nullifier] = true;
    }

    function getCandiates() public view returns (Candidate[] memory){
        return candidates;
    }
}
