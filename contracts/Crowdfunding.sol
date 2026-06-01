// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Crowdfunding on-chain with deadline and refunds
/// @author ITU Mini-Projet
/// @notice Contributors fund a campaign before deadline; owner withdraws if goal reached, otherwise contributors claim refunds.
contract Crowdfunding {
    address public immutable owner;
    uint256 public immutable goal;
    uint256 public immutable deadline;

    uint256 public totalRaised;
    bool public ownerWithdrawn;

    mapping(address => uint256) public contributions;

    event ContributionReceived(address indexed contributor, uint256 amount, uint256 totalRaised);
    event OwnerWithdrawal(address indexed owner, uint256 amount);
    event RefundClaimed(address indexed contributor, uint256 amount);

    error NotOwner();
    error CampaignEnded();
    error CampaignNotEnded();
    error GoalNotReached();
    error GoalAlreadyReached();
    error NothingToRefund();
    error WithdrawAlreadyDone();
    error ZeroValue();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(uint256 _goal, uint256 _durationInSeconds) {
        require(_goal > 0, "Goal must be > 0");
        require(_durationInSeconds > 0, "Duration must be > 0");

        owner = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _durationInSeconds;
    }

    /// @notice Contribute ETH to the campaign before deadline
    function contribute() external payable {
        if (block.timestamp >= deadline) revert CampaignEnded();
        if (msg.value == 0) revert ZeroValue();

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        emit ContributionReceived(msg.sender, msg.value, totalRaised);
    }

    /// @notice Owner withdraws all raised ETH if goal reached after deadline
    function withdrawIfGoalReached() external onlyOwner {
        if (block.timestamp < deadline) revert CampaignNotEnded();
        if (totalRaised < goal) revert GoalNotReached();
        if (ownerWithdrawn) revert WithdrawAlreadyDone();

        ownerWithdrawn = true;
        uint256 amount = address(this).balance;

        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "Transfer failed");

        emit OwnerWithdrawal(owner, amount);
    }

    /// @notice Claim refund after deadline if goal not reached
    function claimRefund() external {
        if (block.timestamp < deadline) revert CampaignNotEnded();
        if (totalRaised >= goal) revert GoalAlreadyReached();

        uint256 amount = contributions[msg.sender];
        if (amount == 0) revert NothingToRefund();

        // CEI pattern
        contributions[msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Refund failed");

        emit RefundClaimed(msg.sender, amount);
    }

    /// @notice Returns campaign state flags for front-end convenience
    function getCampaignStatus() external view returns (bool isActive, bool isSuccessful, bool canRefund) {
        isActive = block.timestamp < deadline;
        isSuccessful = block.timestamp >= deadline && totalRaised >= goal;
        canRefund = block.timestamp >= deadline && totalRaised < goal;
    }
}
