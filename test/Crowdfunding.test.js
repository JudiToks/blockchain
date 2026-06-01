const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Crowdfunding", function () {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();
    const goal = ethers.parseEther("1");
    const duration = 7 * 24 * 60 * 60;

    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    const contract = await Crowdfunding.deploy(goal, duration);

    return { contract, owner, alice, bob, goal, duration };
  }

  it("sets constructor values", async function () {
    const { contract, owner, goal } = await deployFixture();
    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.goal()).to.equal(goal);
  });

  it("accepts contributions before deadline", async function () {
    const { contract, alice } = await deployFixture();
    const amount = ethers.parseEther("0.4");

    await expect(contract.connect(alice).contribute({ value: amount }))
      .to.emit(contract, "ContributionReceived");

    expect(await contract.totalRaised()).to.equal(amount);
    expect(await contract.contributions(alice.address)).to.equal(amount);
  });

  it("rejects zero contribution", async function () {
    const { contract, alice } = await deployFixture();
    await expect(contract.connect(alice).contribute({ value: 0 })).to.be.revertedWithCustomError(contract, "ZeroValue");
  });

  it("owner withdraws after success and deadline", async function () {
    const { contract, owner, alice, bob } = await deployFixture();

    await contract.connect(alice).contribute({ value: ethers.parseEther("0.6") });
    await contract.connect(bob).contribute({ value: ethers.parseEther("0.5") });

    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    const before = await ethers.provider.getBalance(owner.address);
    const tx = await contract.connect(owner).withdrawIfGoalReached();
    const receipt = await tx.wait();

    const gas = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(owner.address);

    expect(after).to.be.gt(before - gas);
    expect(await contract.ownerWithdrawn()).to.equal(true);
  });

  it("contributors can refund after failure and deadline", async function () {
    const { contract, alice } = await deployFixture();
    const amount = ethers.parseEther("0.2");

    await contract.connect(alice).contribute({ value: amount });

    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await contract.connect(alice).claimRefund();
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);

    expect(after).to.be.gt(before - gas);
    expect(await contract.contributions(alice.address)).to.equal(0);
  });
});
