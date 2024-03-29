const { ethers } = require("ethers");
const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const buyer = signers[0];
  const seller = signers[1];
  const inspector = signers[2];
  const lender = signers[3];

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed Real Estate Contract at: ${realEstate.address}`);
  console.log("Minting 3 properties...\n");

  for (let i = 0; i < 3; i++) {
    const tokenURI = `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`;
    const transaction = await realEstate.connect(seller).mint(tokenURI);
    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();

  console.log(`Deployed Escrow Contract at: ${escrow.address}`);
  console.log("Listing 3 properties...\n");

  for (let i = 0; i < 3; i++) {
    // Approve properties...
    const approveTransaction = await realEstate.connect(seller).approve(escrow.address, i + 1);
    await approveTransaction.wait();
  }

  // Listing properties...
  let transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10));
  await transaction.wait();

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5));
  await transaction.wait();

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5));
  await transaction.wait();

  console.log("Finished.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

