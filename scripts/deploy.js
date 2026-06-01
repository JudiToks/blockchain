const hre = require("hardhat");

async function main() {
  const goalEth = "1";
  const durationDays = 7;

  const goalWei = hre.ethers.parseEther(goalEth);
  const durationSeconds = durationDays * 24 * 60 * 60;

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const contract = await Crowdfunding.deploy(goalWei, durationSeconds);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Crowdfunding deployed to:", address);
  console.log("Goal (ETH):", goalEth);
  console.log("Duration (days):", durationDays);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
