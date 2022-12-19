// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GiniMaster is Ownable {
    uint256 public weeklyAllowance;
    address public giniATokens;
    address public giniXpTokens;
    uint256 public nextWeeklyMint;

    address[] peers;
    mapping(address => bool) public peerWhitelist;
    uint256 public peerCounter;
    mapping(address => uint256) public lastActivity;

    event NewPeer(uint256 newPeerId, address newPeerAddress);
    event RemovePeer(address removedPeerAddress);
    event NewAppreciation(
        address appreciator,
        address appreciationReceiver,
        uint256 amount,
        string reason
    );

    constructor() {
        giniATokens = address(
            new GiniTokens("Gini Appreciation Tokens", "GAT")
        );

        giniXpTokens = address(new GiniTokens("Gini Xperience Points", "GXP"));

        weeklyAllowance = 100 ether;
        nextWeeklyMint = 0;
    }

    function updateWeeklyAllowance(uint256 _allowance) public onlyOwner {
        weeklyAllowance = _allowance;
    }

    function isAddressAPeer(address _user) public view returns (bool) {
        return peerWhitelist[_user];
    }

    function getAllPeers() public view returns (address[] memory) {
        return peers;
    }

    function newPeer(address _newPeer) public onlyOwner returns (bool) {
        bool newEntry = true;
        for (uint256 i = 0; i < peers.length; i++) {
            if (peers[i] == _newPeer) {
                newEntry = false;
                revert("Peer already registered");
            }
        }
        if (newEntry) {
            peerWhitelist[_newPeer] = true;
            peers.push(_newPeer);
            peerCounter++;
            emit NewPeer(peerCounter, _newPeer);
        }
        return newEntry;
    }

    function weeklyMintCeremony() public onlyOwner {
        require(
            block.timestamp > nextWeeklyMint,
            "Cannot mint allowances yet."
        );
        for (uint256 i = 0; i < peers.length; i++) {
            GiniTokens giniATokensContract = GiniTokens(giniATokens);
            uint256 peerBal = giniATokensContract.balanceOf(peers[i]);
            if (peerBal > 0) {
                giniATokensContract.burn(peers[i], peerBal);
            }
            giniATokensContract.mint(peers[i], weeklyAllowance);
        }
        nextWeeklyMint = block.timestamp + (7 * 1 days);
    }

    function appreciatePeer(
        address _appreciationReceiver,
        uint256 amount,
        string memory _reason
    ) public {
        require(
            peerWhitelist[msg.sender],
            "The Appreciator is not whitelisted"
        );
        require(
            peerWhitelist[_appreciationReceiver],
            "The Peer being Appreciated is not whitelisted"
        );
        require(
            msg.sender != _appreciationReceiver,
            "The Appreciator cannot reward themself"
        );
        GiniTokens giniATokensContract = GiniTokens(giniATokens);
        uint256 bal = giniATokensContract.balanceOf(msg.sender);
        require(bal >= amount, "Appreciator has insufficient balance");

        giniATokensContract.burn(msg.sender, amount);
        GiniTokens giniXpTokensContract = GiniTokens(giniXpTokens);
        giniXpTokensContract.mint(_appreciationReceiver, amount);
        lastActivity[msg.sender] = block.timestamp;
        emit NewAppreciation(
            msg.sender,
            _appreciationReceiver,
            amount,
            _reason
        );
    }

    function removePeer(address _peer) public onlyOwner {
        require(peerWhitelist[_peer], "Address is not a peer");
        require(
            lastActivity[_peer] < (block.timestamp + (14 * 1 days)),
            "Peer has recorded activity in the last 14 days."
        );
        for (uint256 i = 0; i < peers.length; i++) {
            if (peers[i] == _peer) {
                _deletePeer(i);
                break;
            }
        }
        peerCounter--;
        peerWhitelist[_peer] = false;
        emit RemovePeer(_peer);
    }

    function _deletePeer(uint256 index) internal {
        if (index >= peers.length) return;

        peers[index] = peers[peers.length - 1];
        peers.pop();
    }
}

contract GiniTokens is ERC20, Ownable {
    constructor(string memory _tokenName, string memory _tokenSymbol)
        ERC20(_tokenName, _tokenSymbol)
    {}

    function mint(address account, uint256 amount)
        public
        onlyOwner
        returns (bool)
    {
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount)
        public
        onlyOwner
        returns (bool)
    {
        _burn(account, amount);
        return true;
    }
}
