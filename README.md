# NFT Smart Contract

ERC-721 compatible NFT smart contract with comprehensive automated test suite and Docker containerization.

## Features

- **ERC-721 Compatible**: Full implementation of the ERC-721 standard for NFTs
- **Comprehensive Testing**: Extensive test suite covering all contract functionality
- **Docker Ready**: Fully containerized for reproducible builds and testing
- **Access Control**: Owner-based access control for privileged operations
- **Minting Control**: Pausable minting mechanism with max supply limits
- **Token Metadata**: Support for token URI metadata
- **Burning**: Token burning functionality
- **Approvals**: Full approval and operator mechanisms

## Project Structure

```
nft-contract/
├── contracts/
│   └── NftCollection.sol        # Main ERC-721 compatible contract
├── test/
│   └── NftCollection.test.js    # Comprehensive test suite
├── Dockerfile                    # Docker containerization
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Docker (optional, for containerized testing)

### Installation

```bash
clone the repository
cd nft-smart-contract

# Install dependencies
npm install
```

### Compilation

```bash
npx hardhat compile
```

### Running Tests

```bash
npx hardhat test
```

### Docker Usage

```bash
# Build the Docker image
docker build -t nft-contract .

# Run tests in Docker
docker run nft-contract
```

## Contract Details

### NftCollection Contract

#### State Variables

- `name`: "NFT Collection"
- `symbol`: "NFT"
- `maxSupply`: 10000 tokens
- `totalSupply`: Current number of minted tokens
- `owner`: Contract owner address
- `mintingPaused`: Pause flag for minting

#### Core Functions

##### Minting
- `safeMint(address to, uint256 tokenId)`: Mint a new token (owner only)

##### Transfers
- `transferFrom(address from, address to, uint256 tokenId)`: Transfer token ownership
- `safeTransferFrom(address from, address to, uint256 tokenId)`: Safe transfer

##### Approvals
- `approve(address to, uint256 tokenId)`: Approve address to transfer specific token
- `setApprovalForAll(address operator, bool approved)`: Set operator approval for all tokens
- `getApproved(uint256 tokenId)`: Get approved address for token
- `isApprovedForAll(address owner, address operator)`: Check operator approval status

##### Ownership & Balance
- `balanceOf(address owner)`: Get token count for address
- `ownerOf(uint256 tokenId)`: Get owner of specific token

##### Metadata
- `tokenURI(uint256 tokenId)`: Get metadata URI for token
- `setBaseURI(string memory newBaseURI)`: Set base URI (owner only)

##### Burning
- `burn(uint256 tokenId)`: Burn a token (token owner only)

##### Control
- `pauseMinting()`: Pause token minting (owner only)
- `unpauseMinting()`: Resume token minting (owner only)

## Test Coverage

The test suite includes comprehensive tests for:

- **Deployment**: Contract initialization and state verification
- **Minting**: Token creation with validation
- **Transfers**: Token ownership transfer with authorization checks
- **Approvals**: Single token and operator-level approvals
- **Burning**: Token destruction with state updates
- **Metadata**: Token URI handling
- **Pause/Unpause**: Minting control mechanisms

## Security Considerations

1. **Access Control**: Only the owner can mint tokens and modify configuration
2. **Input Validation**: All input parameters are validated before state changes
3. **Reentrancy**: No external calls in state-modifying functions
4. **Approval Management**: Approvals are cleared after transfer
5. **Max Supply Enforcement**: Prevents minting beyond configured maximum

## Gas Optimization

- Efficient mappings for O(1) lookups
- Minimal storage writes
- Optimized approval clearing on transfers

## License

MIT

## Author

Kishore Kalingi
