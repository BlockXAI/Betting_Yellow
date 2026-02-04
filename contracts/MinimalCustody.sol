// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MinimalCustody
 * @notice Ultra-simple custody contract for Yellow Network demo
 */
contract MinimalCustody {
    mapping(address => uint256) public balances;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Withdrawn(msg.sender, amount);
    }
    
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
    
    function totalBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
