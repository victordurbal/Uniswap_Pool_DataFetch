const fs = require("fs");
const { stringify } = require("csv-stringify");
const Web3 = require('web3')
const url  = '' // input your infura Ethereum Mainnet Network endpoint
const web3 = new Web3(url)

async function main() {

  // the 3 liquidity pool with the biggest TVL are pairs DAI-USDC, USDC-ETH and wBTC-ETH

  var tokenLiqPool_addr = {
    token1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // tokenAddressDAI
    token2: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // tokenAddressUSDC
  };
  var tokenLiqPool_name = {
    token1: "DAI",
    token2: "USDC",
  };
  let uniSwapAddress = "0x5777d92f208679db4b9778590fa3cab3ac9e2168"; // pair USDC / ETH : 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
// pair wBTC / ETH :  0xcbcdf9626bc03e24f779434178a73a0b4bad62ed
// wBTC address : 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599

  // to access several pools instead of one, change dictionaries strings to array in such manner :

  // var tokenLiqPool_addr_multi = {
  //     token1: ["0x6B175474E89094C44Da98b954EedeAC495271d0F", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"], // DAI and USDC
  //     token2: ["0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"] // USDC and ETH
  // };
  // var tokenLiqPool_name_multi = {
  //     token1: ["DAI","USDC"],
  //     token2: ["USDC","wETH"],
  // };
  // let uniSwapAddress_multi = ["0x5777d92f208679db4b9778590fa3cab3ac9e2168","0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"];


  // with multiple pool available, user could choose if they want pool 1 or 2 or 3 ... or all of them
  // we will then create a function with the dictionnaries as parameters and then use function recursion to loop back, if user would want to get the data of multiple pool

  // The minimum ABI to get ERC20 Token balance
  let minABI = [
      // balanceOf
      {
        "constant":true,
        "inputs":[{"name":"_owner","type":"address"}],
        "name":"balanceOf",
        "outputs":[{"name":"balance","type":"uint256"}],
        "type":"function"
      },
      // decimals
      {
        "constant":true,
        "inputs":[],
        "name":"decimals",
        "outputs":[{"name":"","type":"uint8"}],
        "type":"function"
      }
    ];

  let contract_Tok1 = new web3.eth.Contract(minABI,tokenLiqPool_addr['token1']); // with multiple pool, add index after ['token1'] to find corresponding address
  let contract_Tok2 = new web3.eth.Contract(minABI,tokenLiqPool_addr['token2']);

  async function getCurrentBlock(iBlock){
      let currentBlock = await web3.eth.getBlockNumber();
      return currentBlock
  }

  async function getBlockWithNumber(iBlock){
      let block = await web3.eth.getBlock(iBlock, true);
      return block
  }

  async function getToken1_BalanceAtBlk(blockNum,poolAddress) {
    let balanceAtBlk = await contract_Tok1.methods.balanceOf(poolAddress).call(blockNum);
    return balanceAtBlk
  }

  async function getToken2_BalanceAtBlk(blockNum,poolAddress) {
    let balanceAtBlk = await contract_Tok2.methods.balanceOf(poolAddress).call(blockNum);
    return balanceAtBlk
  }

  // a block is validated approx every 12 sec
  // to limit the ammount of data, we take 3 block data per hour (for speed sake) - we can increase it for precision
  const blockRate_dataFetch = 12*5*20; // 5 blocks in 1 minute = 12*5 , x20 minute
  const stopAtBlock = (600*blockRate_dataFetch); // roughly 3 months
  var block_array = []; // record block number where data is fetch
  var balanceHistToken_1 = []; // ammount for token 1 at each selected block
  var balanceHistToken_2 = []; // ammount for token 2 at each selected block
  var dateBlck = [];
  let currentBlock = await getCurrentBlock();
  for (var iBlock=currentBlock; iBlock >= currentBlock-stopAtBlock; iBlock -= blockRate_dataFetch) {
      let block = await getBlockWithNumber(iBlock);
      if (block && block.transactions){

        if(tokenLiqPool_name["token2"] == "USDC"){
          balanceHistToken_1.push(parseFloat(web3.utils.fromWei(await getToken1_BalanceAtBlk(iBlock,uniSwapAddress), "ether")*10e11)); // USDC has only 6 decimal hence we add 10e11, wei to ether function would provide too smaal a value
        }else{
          balanceHistToken_1.push(parseFloat(web3.utils.fromWei(await getToken1_BalanceAtBlk(iBlock,uniSwapAddress), "ether")));
        }
        if(tokenLiqPool_name["token2"] == "USDC"){
          balanceHistToken_2.push((web3.utils.fromWei(await getToken2_BalanceAtBlk(iBlock,uniSwapAddress), "ether")*10e11)); // USDC has only 6 decimal hence we add 10e11, wei to ether function would provide too smaal a value
        }else{
          balanceHistToken_2.push(parseFloat(web3.utils.fromWei(await getToken2_BalanceAtBlk(iBlock,uniSwapAddress), "ether")));
        } 

          block_array.push(iBlock);
          dateBlck.push(block.timestamp);
  }}
  var dataTok = [dateBlck , balanceHistToken_1 , balanceHistToken_2]

  // Create csv file with data from blockchain
  var filename = "blockchainData.csv";
  var writableStream = fs.createWriteStream(filename);

  keysToken = Object.keys(tokenLiqPool_name);
  var columnsName = [
    "Date",
    tokenLiqPool_name[keysToken[0]],
    tokenLiqPool_name[keysToken[1]],
  ];
  var stringifier = stringify({ header: true, columns: columnsName });
  stringifier.write(dataTok);
  stringifier.pipe(writableStream);

}

main();

