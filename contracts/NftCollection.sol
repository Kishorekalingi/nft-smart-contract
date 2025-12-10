// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NftCollection
 * @dev ERC-721 compatible NFT smart contract with comprehensive functionality
 */
contract NftCollection {
    // Contract state variables
    string public name = "NFT Collection";
    string public symbol = "NFT";
    uint256 public maxSupply = 10000;
    uint256 public totalSupply;
    
    address public owner;
    bool public mintingPaused = false;
    string private baseURI = "ipfs://";
    
    // Mappings for token ownership and approvals
    mapping(uint256 => address) private tokenOwner;
    mapping(address => uint256) private balances;
    mapping(uint256 => address) private tokenApprovals;
    mapping(address => mapping(address => bool)) private operatorApprovals;
    mapping(uint256 => string) private tokenURIs;
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier notPaused() {
        require(!mintingPaused, "Minting is paused");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    // ERC-721 standard functions
    /**
     * @dev Returns the number of tokens owned by `account`
     */
    function balanceOf(address account) public view returns (uint256) {
        require(account != address(0), "Invalid address");
        return balances[account];
    }
    
    /**
     * @dev Returns the owner of the `tokenId` token
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner_ = tokenOwner[tokenId];
        require(owner_ != address(0), "Token does not exist");
        return owner_;
    }
    
    /**
     * @dev Safely mints a new token to `to` address
     */
    function safeMint(address to, uint256 tokenId) public onlyOwner notPaused {
        _mint(to, tokenId);
    }
    
    /**
     * @dev Internal mint function
     */
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Cannot mint to zero address");
        require(tokenOwner[tokenId] == address(0), "Token already exists");
        require(totalSupply < maxSupply, "Max supply reached");
        require(tokenId > 0 && tokenId <= maxSupply, "Invalid token ID");
        
        tokenOwner[tokenId] = to;
        balances[to]++;
        totalSupply++;
        
        emit Transfer(address(0), to, tokenId);
    }
    
    /**
     * @dev Transfers `tokenId` from `from` to `to`
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        require(from == ownerOf(tokenId), "From address is not the owner");
        require(to != address(0), "Cannot transfer to zero address");
        
        require(
            msg.sender == from || msg.sender == tokenApprovals[tokenId] || operatorApprovals[from][msg.sender],
            "Not authorized to transfer"
        );
        
        // Clear approvals
        if (tokenApprovals[tokenId] != address(0)) {
            tokenApprovals[tokenId] = address(0);
        }
        
        // Update ownership and balances
        balances[from]--;
        balances[to]++;
        tokenOwner[tokenId] = to;
        
        emit Transfer(from, to, tokenId);
    }
    
    /**
     * @dev Safely transfers `tokenId` from `from` to `to`
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        transferFrom(from, to, tokenId);
    }
    
    /**
     * @dev Safely transfers `tokenId` from `from` to `to` with data
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory) public {
        transferFrom(from, to, tokenId);
    }
    
    /**
     * @dev Approve `to` to operate on `tokenId`
     */
    function approve(address to, uint256 tokenId) public {
        address owner_ = ownerOf(tokenId);
        require(msg.sender == owner_ || operatorApprovals[owner_][msg.sender], "Not authorized");
        
        tokenApprovals[tokenId] = to;
        emit Approval(owner_, to, tokenId);
    }
    
    /**
     * @dev Set or revoke operator approval for all tokens
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Cannot approve yourself");
        
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }
    
    /**
     * @dev Returns the approved address for a token
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        return tokenApprovals[tokenId];
    }
    
    /**
     * @dev Returns if an operator is approved for all tokens
     */
    function isApprovedForAll(address owner_, address operator) public view returns (bool) {
        return operatorApprovals[owner_][operator];
    }
    
    /**
     * @dev Returns the metadata URI for a token
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        
        if (bytes(tokenURIs[tokenId]).length > 0) {
            return tokenURIs[tokenId];
        }
        
        return string(abi.encodePacked(baseURI, _uint2str(tokenId)));
    }
    
    /**
     * @dev Set the base URI for token metadata
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }
    
    /**
     * @dev Pause minting
     */
    function pauseMinting() public onlyOwner {
        mintingPaused = true;
    }
    
    /**
     * @dev Unpause minting
     */
    function unpauseMinting() public onlyOwner {
        mintingPaused = false;
    }
    
    /**
     * @dev Burn a token
     */
    function burn(uint256 tokenId) public {
        require(tokenOwner[tokenId] != address(0), "Token does not exist");
        require(msg.sender == ownerOf(tokenId), "Only owner can burn");
        
        address owner_ = tokenOwner[tokenId];
        
        if (tokenApprovals[tokenId] != address(0)) {
            tokenApprovals[tokenId] = address(0);
        }
        
        balances[owner_]--;
        totalSupply--;
        tokenOwner[tokenId] = address(0);
        
        emit Transfer(owner_, address(0), tokenId);
    }
    
    // Utility function
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
