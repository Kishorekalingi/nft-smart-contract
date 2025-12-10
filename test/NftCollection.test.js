const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NftCollection", function () {
  let nftCollection;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    const NftCollection = await ethers.getContractFactory("NftCollection");
    nftCollection = await NftCollection.deploy();
    await nftCollection.deployed();

    [owner, addr1, addr2, addr3] = await ethers.getSigners();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await nftCollection.name()).to.equal("NFT Collection");
      expect(await nftCollection.symbol()).to.equal("NFT");
    });

    it("Should have max supply of 10000", async function () {
      expect(await nftCollection.maxSupply()).to.equal(10000);
    });

    it("Should initialize total supply to 0", async function () {
      expect(await nftCollection.totalSupply()).to.equal(0);
    });

    it("Should set the deployer as owner", async function () {
      expect(await nftCollection.owner()).to.equal(owner.address);
    });

    it("Should not be paused initially", async function () {
      const paused = await nftCollection.mintingPaused();
      expect(paused).to.equal(false);
    });
  });

  describe("Minting", function () {
    it("Should mint a token successfully", async function () {
      await nftCollection.safeMint(addr1.address, 1);
      expect(await nftCollection.ownerOf(1)).to.equal(addr1.address);
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(1);
      expect(await nftCollection.totalSupply()).to.equal(1);
    });

    it("Should emit Transfer event on mint", async function () {
      await expect(nftCollection.safeMint(addr1.address, 1))
        .to.emit(nftCollection, "Transfer")
        .withArgs(ethers.constants.AddressZero, addr1.address, 1);
    });

    it("Should not allow minting to zero address", async function () {
      await expect(
        nftCollection.safeMint(ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should not allow double-minting same tokenId", async function () {
      await nftCollection.safeMint(addr1.address, 1);
      await expect(
        nftCollection.safeMint(addr2.address, 1)
      ).to.be.revertedWith("Token already exists");
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        nftCollection.connect(addr1).safeMint(addr1.address, 1)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should not mint beyond max supply", async function () {
      const maxSupply = await nftCollection.maxSupply();
      for (let i = 1; i < maxSupply.toNumber(); i++) {
        await nftCollection.safeMint(addr1.address, i);
      }
      await expect(
        nftCollection.safeMint(addr1.address, maxSupply.toNumber() + 1)
      ).to.be.revertedWith("Invalid token ID");
    });

    it("Should not allow invalid token IDs (0 or > maxSupply)", async function () {
      await expect(
        nftCollection.safeMint(addr1.address, 0)
      ).to.be.revertedWith("Invalid token ID");
    });

    it("Should not mint when minting is paused", async function () {
      await nftCollection.pauseMinting();
      await expect(
        nftCollection.safeMint(addr1.address, 1)
      ).to.be.revertedWith("Minting is paused");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
      await nftCollection.safeMint(addr1.address, 2);
    });

    it("Should transfer token from owner", async function () {
      await nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      expect(await nftCollection.ownerOf(1)).to.equal(addr2.address);
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(1);
      expect(await nftCollection.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should emit Transfer event", async function () {
      await expect(
        nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 1)
      )
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, addr2.address, 1);
    });

    it("Should not allow transfer to zero address", async function () {
      await expect(
        nftCollection.connect(addr1).transferFrom(addr1.address, ethers.constants.AddressZero, 1)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Should not allow transfer of non-existent token", async function () {
      await expect(
        nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 999)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should not allow unauthorized transfer", async function () {
      await expect(
        nftCollection.connect(addr2).transferFrom(addr1.address, addr2.address, 1)
      ).to.be.revertedWith("Not authorized to transfer");
    });

    it("Should allow approved address to transfer", async function () {
      await nftCollection.connect(addr1).approve(addr2.address, 1);
      await nftCollection.connect(addr2).transferFrom(addr1.address, addr3.address, 1);
      expect(await nftCollection.ownerOf(1)).to.equal(addr3.address);
    });

    it("Should clear approval after transfer", async function () {
      await nftCollection.connect(addr1).approve(addr2.address, 1);
      await nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
      expect(await nftCollection.getApproved(1)).to.equal(ethers.constants.AddressZero);
    });
  });

  describe("Approvals", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should approve address for token", async function () {
      await nftCollection.connect(addr1).approve(addr2.address, 1);
      expect(await nftCollection.getApproved(1)).to.equal(addr2.address);
    });

    it("Should emit Approval event", async function () {
      await expect(
        nftCollection.connect(addr1).approve(addr2.address, 1)
      )
        .to.emit(nftCollection, "Approval")
        .withArgs(addr1.address, addr2.address, 1);
    });

    it("Should set approval for all tokens", async function () {
      await nftCollection.connect(addr1).setApprovalForAll(addr2.address, true);
      expect(await nftCollection.isApprovedForAll(addr1.address, addr2.address)).to.equal(true);
    });

    it("Should emit ApprovalForAll event", async function () {
      await expect(
        nftCollection.connect(addr1).setApprovalForAll(addr2.address, true)
      )
        .to.emit(nftCollection, "ApprovalForAll")
        .withArgs(addr1.address, addr2.address, true);
    });

    it("Should revoke approval", async function () {
      await nftCollection.connect(addr1).setApprovalForAll(addr2.address, true);
      await nftCollection.connect(addr1).setApprovalForAll(addr2.address, false);
      expect(await nftCollection.isApprovedForAll(addr1.address, addr2.address)).to.equal(false);
    });

    it("Should not allow self-approval", async function () {
      await expect(
        nftCollection.connect(addr1).setApprovalForAll(addr1.address, true)
      ).to.be.revertedWith("Cannot approve yourself");
    });

    it("Should allow operator to transfer", async function () {
      await nftCollection.connect(addr1).setApprovalForAll(addr2.address, true);
      await nftCollection.connect(addr2).transferFrom(addr1.address, addr3.address, 1);
      expect(await nftCollection.ownerOf(1)).to.equal(addr3.address);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
      await nftCollection.safeMint(addr1.address, 2);
    });

    it("Should burn a token", async function () {
      await nftCollection.connect(addr1).burn(1);
      await expect(nftCollection.ownerOf(1)).to.be.revertedWith("Token does not exist");
      expect(await nftCollection.balanceOf(addr1.address)).to.equal(1);
      expect(await nftCollection.totalSupply()).to.equal(1);
    });

    it("Should emit Transfer event when burning", async function () {
      await expect(nftCollection.connect(addr1).burn(1))
        .to.emit(nftCollection, "Transfer")
        .withArgs(addr1.address, ethers.constants.AddressZero, 1);
    });

    it("Should not allow burning non-owned token", async function () {
      await expect(
        nftCollection.connect(addr2).burn(1)
      ).to.be.revertedWith("Only owner can burn");
    });
  });

  describe("Metadata", function () {
    beforeEach(async function () {
      await nftCollection.safeMint(addr1.address, 1);
    });

    it("Should return token URI", async function () {
      const uri = await nftCollection.tokenURI(1);
      expect(uri).to.include("ipfs://");
    });

    it("Should revert for non-existent token URI", async function () {
      await expect(nftCollection.tokenURI(999)).to.be.revertedWith("Token does not exist");
    });

    it("Should allow owner to set base URI", async function () {
      await nftCollection.setBaseURI("https://example.com/");
      const uri = await nftCollection.tokenURI(1);
      expect(uri).to.equal("https://example.com/1");
    });

    it("Should not allow non-owner to set base URI", async function () {
      await expect(
        nftCollection.connect(addr1).setBaseURI("https://example.com/")
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause minting", async function () {
      await nftCollection.pauseMinting();
      expect(await nftCollection.mintingPaused()).to.equal(true);
    });

    it("Should allow owner to unpause minting", async function () {
      await nftCollection.pauseMinting();
      await nftCollection.unpauseMinting();
      expect(await nftCollection.mintingPaused()).to.equal(false);
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        nftCollection.connect(addr1).pauseMinting()
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});
