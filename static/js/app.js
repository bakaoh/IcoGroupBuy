App = {
  MAX_TOTAL: 500, // ether
  MIN_EACH: 0.01, // ether
  MAX_EACH: 2, // ether
  START_TIME: 1520062494081,
  END_TIME: 1525246494081,
  ethPrice: 'https://api.coinmarketcap.com/v1/ticker/ethereum/',
  web3Provider: null,
  contracts: {},

  init: function () {
    var endDate = new Date(App.END_TIME);
    $('#info-deadline').text(endDate.getDate() + "/" + (endDate.getMonth() + 1) + "/" + endDate.getFullYear());
    $('#bar-deadline').css("width", (new Date().getTime() - App.START_TIME) * 100 / (App.END_TIME - App.START_TIME) + "%");
    $('#info-deadline-p').text(Math.ceil((App.END_TIME - new Date().getTime()) / (1000 * 3600 * 24)) + " days left");
    App.updatePrice();
    
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);

      web3.version.getNetwork((err, netId) => {
        console.log(netId);
        switch (netId) {
          case "1":
            $('#info-network').text("mainnet");
            break
          case "2":
            $('#info-network').text("morden");
            console.log('This is the deprecated Morden test network.')
            break
          case "3":
            $('#info-network').text("ropsten");
            break
          default:
            App.address = "0x7105a11e8487bfaf8c02aa6a7cda5283f971107c";
            $('#info-network').text("private");
        }

        if (App.address) {
          App.initContract();
        } else {
          $('#modal-warning-body').html('<p>Unsupported network, you till can view some information in this page but can not interact with the contract (send contribution or claim token)</p><p>Please try mainnet or ropsten testnet.</p><img src="static/img/network.jpg" style="max-width: 100%" alt="change network">');
          $('#modal-warning').modal();
        }
      });
    } else {
      $('#info-network').text("disable");
      $('#modal-warning-body').html('<p>Please install <a href="https://metamask.io/">Metamask</a> or use a web3 supported browser for the best experience. </p><p>Without web3 enable, you till can view some information in this page but can not interact with the contract (send contribution or claim token)</p>');
      $('#modal-warning').modal();
    }
  },

  initContract: function () {
    var icon = blockies.create({
      seed: App.address,
      size: 15,
      scale: 3,
    });

    $('#contract-avatar').attr("src", icon.toDataURL());
    $('#contract-addr').text(App.address);

    $.getJSON('GroupBuy.abi', function (data) {
      App.abi = data;
      App.contracts.GroupBuy = web3.eth.contract(App.abi).at(App.address);
      return App.getInfos();
    });
  },

  handleSend: function (event) {
    event.preventDefault();

    var amount = parseFloat($('#send-amount').val());
    if (!amount || amount <= App.MIN_EACH) {
      $('#modal-warning-body').html('<p>Min contribution is ' + App.MIN_EACH + ' eth </p>');
      $('#modal-warning').modal();
      return;
    }
    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.GroupBuy.contribute({ from: account, gas: 110000, value: amount * 10 ** 18 }, function (error, result) {
        if (!error) {
          $('#modal-success').modal();
        } else {
          console.log(error);
          $('#modal-warning-body').html('<p>Some error occurred: ' + error.message.split("\n", 1) + ' </p>');
          $('#modal-warning').modal();
        }
      });
    });
  },

  handleClaim: function (event) {
    event.preventDefault();

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.GroupBuy.claim({ from: account, gas: 110000 }, function (error, result) {
        if (!error) {
          $('#modal-success').modal();
        } else {
          console.log(error);
          $('#modal-warning-body').html('<p>Some error occurred: ' + error.message.split("\n", 1) + ' </p>');
          $('#modal-warning').modal();
        }
      });
    });
  },

  getInfos: function () {
    console.log('Getting info...');

    web3.eth.getAccounts(function (error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];
      App.contracts.GroupBuy.info(function (error, result) {
        console.log(error);

        $('#user-eth').text(App.roundUp(result[1].toNumber() / 10 ** 18) + " (max " + App.MAX_EACH + " eth)");
        $('#user-token').text(result[2].c[0]);

        var totalEth = App.roundUp(result[3].toNumber() / 10 ** 18);
        var totalEthP = App.roundUp(totalEth * 100 / App.MAX_TOTAL);
        $('#info-total-eth').text(totalEth + "/" + App.MAX_TOTAL + " Eth");
        $('#bar-total-eth').css("width", totalEthP + "%");
        $('#info-total-eth-p').text(totalEthP + "%");

        if (result[0].c[0] == 1) {
          $('#send-group').show();
          $(document).on('click', '#send-btn', App.handleSend);
        } else if (result[0].c[0] == 3) {
          $('#claim-btn').show();
          $(document).on('click', '#claim-btn', App.handleClaim);
        }
      });
    });
  },

  roundUp: function (num) {
    return (Math.round(num * 1000) / 1000);
  },

  updatePrice: function () {
    $.ajax({
      url: App.ethPrice,
      success: function (json) {
        $('#info-eth-price').text("1 Eth = " + Math.ceil(json[0].price_usd) + " Usd");
      }
    });
  }

};

$(document).ready(function () {
  App.init();
});
