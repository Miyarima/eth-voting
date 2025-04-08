import { expect } from "chai";
import { ethers } from "hardhat";
import type { Voting_program } from "../typechain-types";
import { groth16 } from "snarkjs";
import * as fs from "fs";

// describe("VotingProgram", function () {
//   let voting: Voting_program;
//   let owner: any;
//   let addr1: any;
//   let addr2: any;

//   before(async function () {
//     [owner, addr1, addr2] = await ethers.getSigners();
    
//     const Voting = await ethers.getContractFactory("Voting_program");
//     voting = await Voting.deploy(["Alice", "Bob", "Charlie"]);
//     await voting.waitForDeployment(); // Changed from deployed()
//   });

//   it("Should initialize with correct candidates", async function () {
//     const candidates = await voting.getCandiates();
//     expect(candidates.length).to.equal(3);
//     expect(candidates[0].name).to.equal("Alice");
//     expect(candidates[1].name).to.equal("Bob");
//     expect(candidates[2].name).to.equal("Charlie");
//   });

//   it("Should allow voting and prevent double voting", async function () {
//     await voting.connect(addr1).vote(0);
//     const candidatesAfterVote = await voting.getCandiates();
//     expect(candidatesAfterVote[0].voteCount).to.equal(1);
    
//     await expect(voting.connect(addr1).vote(1))
//       .to.be.revertedWith("You have already voted.");
//   });

//   it("Should reject invalid candidate index", async function () {
//     await expect(voting.connect(addr2).vote(99))
//       .to.be.revertedWith("Invalid candidate index.");
//   });
// });

// describe("Mass Voting Simulation", function () {
//   let voting: Voting_program;
//   const VOTER_COUNT = 1000;
//   const CANDIDATES = ["Alice", "Bob", "Charlie"];
//   const candidateVotes = new Array(CANDIDATES.length).fill(0);

//   before(async function () {
//     // Increase mocha timeout for large tests
//     this.timeout(60000); // 60 seconds
    
//     const Voting = await ethers.getContractFactory("Voting_program");
//     voting = await Voting.deploy(CANDIDATES);
//     await voting.waitForDeployment();
//   });

//   it("Should handle 1000 voters", async function () {
//     // Create 1000 test accounts
//     const voters = [];
//     for (let i = 0; i < VOTER_COUNT; i++) {
//       voters.push((await ethers.getSigners())[i + 1]); // Skip owner (index 0)
//     }

//     // Simulate voting (spread votes among candidates)
//     for (let i = 0; i < VOTER_COUNT; i++) {
//       const candidateIndex = Math.floor(Math.random() * CANDIDATES.length);
//       await voting.connect(voters[i]).vote(candidateIndex);
//       candidateVotes[candidateIndex]++;
//     }

//     // Verify results
//     const finalCandidates = await voting.getCandiates();
    
//     console.log("\nVoting Results:");
//     finalCandidates.forEach((candidate, index) => {
//       console.log(`${candidate.name}: ${candidate.voteCount} votes`);
//       expect(candidate.voteCount).to.equal(candidateVotes[index]);
//     });
    
//     console.log(`\nTotal votes cast: ${finalCandidates.reduce((sum, c) => sum + c.voteCount, 0)}`);
//   });
// });

describe("Mass Voting Simulation", function () {
  let voting: Voting_program;
  const VOTER_COUNT = 1000;
  const CANDIDATES = ["Socialdemokraterna", "Sverigedemokrater", "Vänsterpartiet", "Moderaterna", "Centerpartiet", "Kristdemokraterna", "Liberalerna"];
  const candidateVotes = new Array(CANDIDATES.length).fill(0);

  before(async function () {
    this.timeout(60000); // 60 second timeout
    
    const Voting = await ethers.getContractFactory("Voting_program");
    voting = await Voting.deploy(CANDIDATES);
    await voting.waitForDeployment();
  });

  it("Should handle 1000 voters", async function () {
    // Generate 1000 test wallets
    const wallets = [];
    for (let i = 0; i < VOTER_COUNT; i++) {
      wallets.push(ethers.Wallet.createRandom().connect(ethers.provider));
    }

    // Fund the wallets (each needs a small amount of ETH)
    const [owner] = await ethers.getSigners();
    for (const wallet of wallets) {
      await owner.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther("0.01") // 0.01 ETH per voter
      });
    }

    // Simulate voting
    // for (let i = 0; i < VOTER_COUNT; i++) {
    //   const candidateIndex = i % CANDIDATES.length;
    //   await voting.connect(wallets[i]).vote(candidateIndex);
    //   candidateVotes[candidateIndex]++;
    // }

    for (let i = 0; i < VOTER_COUNT; i++) {
      const candidateIndex = Math.floor(Math.random() * CANDIDATES.length);
      await voting.connect(wallets[i]).vote(candidateIndex);
      candidateVotes[candidateIndex]++;
    }

    // Verify results
    const finalCandidates = await voting.getCandiates();
    
    console.log("\nVoting Results:");
    finalCandidates.forEach((candidate, index) => {
      console.log(`${candidate.name}: ${candidate.voteCount} votes`);
      expect(candidate.voteCount).to.equal(candidateVotes[index]);
    });
  });
});

describe("ZK Voting", function () {
  let voting: any;
  let verifier: any;

  before(async function () {
    this.timeout(60000);
    
    // Compile circuit and generate proof
    const { proof, publicSignals } = await groth16.fullProve(
      { voterId: "123" }, // Example voter ID
      "circuits/vote.wasm",
      "circuits/vote.zkey"
    );

    // Deploy verifier
    const Verifier = await ethers.getContractFactory("Verifier");
    verifier = await Verifier.deploy();
    await verifier.deployed();

    // Deploy voting contract
    const Voting = await ethers.getContractFactory("Voting_program");
    voting = await Voting.deploy(["Alice", "Bob", "Charlie"], verifier.address);
    await voting.deployed();
  });

  it("Should accept valid ZK proof", async function () {
    const { proof, publicSignals } = await groth16.fullProve(
      { voterId: "456" }, 
      "circuits/vote.wasm",
      "circuits/vote.zkey"
    );

    const formattedProof = [
      proof.pi_a[0], proof.pi_a[1],
      proof.pi_b[0][0], proof.pi_b[0][1],
      proof.pi_b[1][0], proof.pi_b[1][1],
      proof.pi_c[0], proof.pi_c[1]
    ];

    await voting.vote(0, formattedProof, publicSignals[0]);
    expect(await voting.nullifiers(publicSignals[0])).to.be.true;
  });
});