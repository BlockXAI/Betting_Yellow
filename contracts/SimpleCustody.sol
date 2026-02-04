// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleCustody
 * @notice Minimal custody contract for Yellow Network state channels
 * @dev Holds user deposits for off-chain state channel transactions
 */
contract SimpleCustody {
    // User balances
    mapping(address => uint256) public balances;
    
    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    
    /**
     * @notice Deposit AVAX into custody contract
     * @dev Increases user's balance in the mapping
     */
    function deposit() external payable {
        require(msg.value > 0, "Must send AVAX");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @notice Withdraw AVAX from custody contract
     * @param amount Amount of AVAX to withdraw (in wei)
     * @dev Decreases user's balance and sends AVAX to user
     */
    function withdraw(uint256 amount) external returns (bool) {
        require(amount > 0, "Amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, amount);
        return true;
    }
    
    /**
     * @notice Get user's balance in custody contract
     * @param account Address to check balance for
     * @return User's balance in wei
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    /**
     * @notice Get contract's total AVAX balance
     * @return Total AVAX held by contract
     */
    function totalBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Emergency function to recover stuck funds (owner only in production)
     * @dev For demo purposes, anyone can call this
     */
    function emergencyWithdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Emergency withdraw failed");
        
        emit Withdrawal(msg.sender, amount);
    }
}
